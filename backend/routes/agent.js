const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const authenticateToken = require('../middleware/auth');
const db = require('../database');
const randomizer = require('../utils/randomizer');

// Initialize AI client (supports both OpenAI and Qwen/DashScope)
let openai;
let aiProvider = null; // 'openai' or 'qwen'

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  aiProvider = 'openai';
} else if (process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY) {
  const qwenApiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
  const qwenBaseUrl = process.env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
  
  openai = new OpenAI({
    apiKey: qwenApiKey,
    baseURL: qwenBaseUrl
  });
  aiProvider = 'qwen';
}

const getModelName = () => {
  if (aiProvider === 'qwen') {
    return process.env.QWEN_MODEL || 'qwen-plus';
  }
  return 'gpt-3.5-turbo';
};

/**
 * Parse natural language query to extract options and weights
 * Uses OpenAI to understand the user's intent
 */
const parseNaturalLanguageQuery = async (userMessage, userId, dbInstance) => {
  if (!openai) {
    // Fallback: simple comma/space splitting
    return parseSimpleQuery(userMessage);
  }

  try {
    // Get user's recent context for better parsing
    const recentHistory = dbInstance.prepare(`
      SELECT query_text, dr.created_at
      FROM decision_requests dr
      WHERE dr.user_id = ?
      ORDER BY dr.created_at DESC
      LIMIT 5
    `).all(userId);

    const contextInfo = recentHistory.length > 0 
      ? `\nRecent decision history:\n${recentHistory.map(h => `- "${h.query_text}" on ${h.created_at}`).join('\n')}`
      : '';

    const systemPrompt = `You are a decision parser assistant. Your task is to parse natural language queries and extract:
1. The main intent/question (query)
2. List of options with optional weights (chances) — extract ALL options mentioned, there can be 2 or more
3. Time references (e.g., "last week", "yesterday")
4. Any other relevant context

Respond with JSON in this exact format:
{
  "query": "the main decision question",
  "options": [
    {"text": "option 1", "weight": 1},
    {"text": "option 2", "weight": 2},
    {"text": "option 3", "weight": 1}
  ],
  "time_reference": "optional time reference if mentioned",
  "context": "any additional context"
}

Rules:
- If no weights are mentioned, set weight to 1 for all options
- Weights represent relative chances (higher = more likely to be chosen)
- Try to identify ALL options even in messy input — do not limit to 2
- If user mentions previous decisions, note the time reference`;

    const response = await openai.chat.completions.create({
      model: getModelName(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse this decision query: "${userMessage}"${contextInfo}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed;
  } catch (error) {
    console.error('OpenAI parsing error:', error);
    // Fallback to simple parsing
    return parseSimpleQuery(userMessage);
  }
};

/**
 * Simple fallback parser without AI
 */
const parseSimpleQuery = (message) => {
  // Remove common greetings and fillers
  let cleaned = message
    .replace(/^(hi|hello|hey|help me|please|can you|could you)[,.]?\s*/i, '')
    .trim();

  // Try to find options separated by commas, "or", "and", etc.
  let options = [];
  
  // Split by common separators
  const separators = /[,;]|\sor\s|\band\b|\s\/\s|\t/;
  const parts = cleaned.split(separators).map(p => p.trim()).filter(p => p.length > 0);

  if (parts.length >= 2) {
    // The first part might contain the question
    const firstPart = parts[0];
    const hasQuestion = firstPart.includes('?') || 
                       /^(choose|pick|select|decide|which|what)/i.test(firstPart);
    
    let query = hasQuestion ? firstPart : 'Make a decision';
    let optionTexts = hasQuestion ? parts.slice(1) : parts;

    // Check for weights (e.g., "pizza:3" or "sushi (weight: 2)")
    options = optionTexts.map(opt => {
      const weightMatch = opt.match(/[:\(]?\s*(\d+)\s*[\)]?$/);
      if (weightMatch) {
        return {
          text: opt.replace(/[:\(]?\s*\d+\s*[\)]?$/, '').trim(),
          weight: parseInt(weightMatch[1])
        };
      }
      return { text: opt, weight: 1 };
    });

    return {
      query,
      options,
      time_reference: null,
      context: null
    };
  }

  // If we can't parse, return the whole message as a query with no options
  return {
    query: cleaned,
    options: [],
    time_reference: null,
    context: null
  };
};

/**
 * Generate AI response for chat
 */
const generateChatResponse = async (userMessage, conversationHistory, decisionResult) => {
  if (!openai) {
    return {
      message: `I've made a decision for you! The choice is: **${decisionResult.chosenOption.text}**`,
      requiresAI: false
    };
  }

  try {
    const systemPrompt = `You are a friendly decision-making assistant. Your role:
1. Help users make decisions by understanding their natural language queries
2. Present the chosen option in a friendly, conversational way
3. Provide brief reasoning or encouragement
4. Keep responses concise (2-3 sentences max)

Be positive, encouraging, and slightly playful when presenting decisions.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: "user", content: userMessage }
    ];

    // Add decision result context if available
    if (decisionResult) {
      messages.push({
        role: "system",
        content: `The decision was just made. The chosen option is: "${decisionResult.chosenOption.text}" from options: ${decisionResult.allOptions.map(o => o.text).join(', ')}. Present this result conversationally.`
      });
    }

    const response = await openai.chat.completions.create({
      model: getModelName(),
      messages: messages,
      temperature: 0.7,
      max_tokens: 150
    });

    return {
      message: response.choices[0].message.content,
      requiresAI: true
    };
  } catch (error) {
    console.error('OpenAI chat error:', error);
    return {
      message: `I've made a decision for you! The choice is: **${decisionResult.chosenOption.text}**`,
      requiresAI: false
    };
  }
};

// Chat with AI agent
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if OpenAI is configured
    if (!openai) {
      return res.status(501).json({ 
        error: 'AI agent requires OPENAI_API_KEY to be configured',
        fallback: true
      });
    }

    // Parse the natural language query
    const parsed = await parseNaturalLanguageQuery(message, req.user.id, db.getDb());

    // If we have options, make a decision
    let decisionResult = null;
    if (parsed.options && parsed.options.length > 0) {
      decisionResult = randomizer.makeDecision(
        db.getDb(),
        req.user.id,
        parsed.query,
        parsed.options,
        true
      );
    }

    // Generate conversational response
    const chatResponse = await generateChatResponse(
      message,
      conversationHistory,
      decisionResult
    );

    res.json({
      parsed,
      decision: decisionResult,
      response: chatResponse.message
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Quick decision with natural language
router.post('/decide', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Parse natural language
    const parsed = await parseNaturalLanguageQuery(message, req.user.id, db.getDb());

    if (!parsed.options || parsed.options.length === 0) {
      return res.status(400).json({ 
        error: 'Could not extract options from message. Please provide options separated by commas.' 
      });
    }

    // Make decision
    const decisionResult = randomizer.makeDecision(
      db.getDb(),
      req.user.id,
      parsed.query,
      parsed.options,
      true
    );

    res.json(decisionResult);
  } catch (error) {
    console.error('Agent decide error:', error);
    res.status(500).json({ error: 'Failed to make decision' });
  }
});

module.exports = router;
