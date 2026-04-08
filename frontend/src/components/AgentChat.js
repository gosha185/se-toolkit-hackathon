import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';

const AgentChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your decision-making assistant. 🤖\n\nYou can tell me things like:\n• "Should I eat pizza, sushi, or burgers?"\n• "Help me choose: movie, book, game"\n• "Pick one: red (weight: 3), blue, green"\n\nJust describe what you need help deciding!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError('');
    setLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await api.chatWithAgent(userMessage, conversationHistory);

      if (response.error) {
        if (response.fallback) {
          setError('AI agent requires OPENAI_API_KEY to be configured on the server. Using basic mode.');
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Please provide options in your message, separated by commas. Example: "pizza, sushi, burgers"'
          }]);
        } else {
          setError(response.error);
        }
      } else {
        // Add assistant response
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.response 
        }]);

        // If a decision was made, show it
        if (response.decision) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: formatDecision(response.decision),
            isDecision: true
          }]);
        }
      }
    } catch (err) {
      setError('Failed to communicate with agent. Please try again.');
    }

    setLoading(false);
  };

  const formatDecision = (decision) => {
    const options = decision.allOptions.map((opt, i) => 
      `${i + 1}. ${opt.text}${opt.weight > 1 ? ` (weight: ${opt.weight})` : ''}`
    ).join('\n');

    return `🎯 Decision Made!\n\nChosen: ${decision.chosenOption.text}\n\nFrom options:\n${options}`;
  };

  const suggestedPrompts = [
    "What should I eat: pizza, sushi, or burgers?",
    "Choose a movie genre: action, comedy, drama, horror",
    "Pick a color for my room: blue (weight: 3), green, yellow",
    "Help me decide: gym, running, swimming"
  ];

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-lg border-0" style={{ height: 'calc(100vh - 140px)' }}>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">🤖 AI Decision Agent</h4>
            </Card.Header>
            
            <Card.Body className="p-0 d-flex flex-column" style={{ height: 'calc(100% - 60px)' }}>
              {/* Messages Area */}
              <div 
                className="flex-grow-1 p-3 overflow-auto"
                style={{ maxHeight: 'calc(100% - 120px)' }}
              >
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-3 ${
                      msg.role === 'user' ? 'text-end' : 
                      msg.role === 'system' ? 'text-center' : 'text-start'
                    }`}
                  >
                    <div
                      className={`d-inline-block p-3 rounded ${
                        msg.role === 'user' ? 'bg-primary text-white' :
                        msg.role === 'system' ? 'bg-success text-white' :
                        'bg-light border'
                      }`}
                      style={{ 
                        maxWidth: '80%',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {msg.role === 'assistant' && (
                        <div className="mb-1">
                          <strong>🤖 Agent</strong>
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="text-start mb-3">
                    <div className="d-inline-block p-3 rounded bg-light border">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span className="text-muted">Thinking...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Prompts */}
              {messages.length <= 1 && (
                <div className="px-3 pb-2">
                  <small className="text-muted d-block mb-2">Try these examples:</small>
                  <div className="d-flex flex-wrap gap-2">
                    {suggestedPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setInput(prompt)}
                        className="text-start"
                        style={{ fontSize: '0.85rem', whiteSpace: 'normal', height: 'auto' }}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 border-top">
                {error && <Alert variant="danger" className="mb-2 py-2">{error}</Alert>}
                <Form onSubmit={handleSend}>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your decision request here..."
                      className="flex-grow-1"
                      disabled={loading}
                    />
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={loading || !input.trim()}
                    >
                      {loading ? <Spinner animation="border" size="sm" /> : 'Send'}
                    </Button>
                  </div>
                </Form>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AgentChat;
