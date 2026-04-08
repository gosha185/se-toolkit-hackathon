/**
 * Weighted random selection with history tracking
 * Helps vary decisions by reducing chance of recently/frequently chosen options
 */

/**
 * Adjust weights based on selection history to vary outputs
 * @param {Array} options - Array of {id, text, weight} objects
 * @param {Array} history - Array of previously chosen option IDs
 * @returns {Array} Options with adjusted weights
 */
const adjustWeightsBasedOnHistory = (options, history) => {
  if (!history || history.length === 0) {
    return options.map(opt => ({ ...opt, adjustedWeight: opt.weight }));
  }

  // Count how many times each option was chosen
  const choiceCounts = {};
  history.forEach(chosenId => {
    choiceCounts[chosenId] = (choiceCounts[chosenId] || 0) + 1;
  });

  const maxChoices = Math.max(...Object.values(choiceCounts), 1);

  // Reduce weight for frequently chosen options
  return options.map(opt => {
    const timesChosen = choiceCounts[opt.id] || 0;
    const frequencyPenalty = timesChosen / maxChoices; // 0 to 1
    const weightMultiplier = 1 - (frequencyPenalty * 0.5); // Reduce by up to 50%
    
    return {
      ...opt,
      adjustedWeight: opt.weight * weightMultiplier
    };
  });
};

/**
 * Perform weighted random selection
 * @param {Array} optionsWithWeights - Array of {id, text, adjustedWeight} objects
 * @returns {Object} Selected option
 */
const weightedRandomSelect = (optionsWithWeights) => {
  if (optionsWithWeights.length === 0) {
    throw new Error('No options to select from');
  }

  if (optionsWithWeights.length === 1) {
    return optionsWithWeights[0];
  }

  // Calculate total weight
  const totalWeight = optionsWithWeights.reduce((sum, opt) => sum + opt.adjustedWeight, 0);
  
  if (totalWeight <= 0) {
    throw new Error('Total weight must be positive');
  }

  // Generate random number
  let random = Math.random() * totalWeight;
  
  // Select option
  for (const option of optionsWithWeights) {
    random -= option.adjustedWeight;
    if (random <= 0) {
      return option;
    }
  }

  // Fallback (should not reach here)
  return optionsWithWeights[optionsWithWeights.length - 1];
};

/**
 * Get recent decision history for a user and query pattern
 * @param {Object} db - Database instance
 * @param {number} userId - User ID
 * @param {string} queryPattern - Query text or pattern to match
 * @param {number} daysBack - How many days back to look (default: 30)
 * @returns {Array} Array of chosen option IDs
 */
const getDecisionHistory = (db, userId, queryPattern, daysBack = 30) => {
  const stmt = db.prepare(`
    SELECT o.id, o.option_text, dr.query_text, d.created_at
    FROM decisions d
    JOIN options o ON d.chosen_option_id = o.id
    JOIN decision_requests dr ON d.request_id = dr.id
    WHERE dr.user_id = ? 
      AND dr.created_at >= datetime('now', ?)
      AND (dr.query_text LIKE ? OR ? IS NULL)
    ORDER BY d.created_at DESC
  `);

  const pattern = queryPattern ? `%${queryPattern}%` : null;
  const daysClause = `-${daysBack} days`;
  
  return stmt.all(userId, daysClause, pattern, pattern);
};

/**
 * Make a decision with weighted random selection and history awareness
 * @param {Object} db - Database instance
 * @param {number} userId - User ID
 * @param {string} queryText - The decision query
 * @param {Array} options - Array of {text, weight} objects
 * @param {boolean} useHistoryAwareness - Whether to adjust weights based on history
 * @returns {Object} Decision result
 */
const makeDecision = (db, userId, queryText, options, useHistoryAwareness = true) => {
  const transaction = db.transaction(() => {
    // Insert decision request
    const requestStmt = db.prepare(
      'INSERT INTO decision_requests (user_id, query_text) VALUES (?, ?)'
    );
    const requestResult = requestStmt.run(userId, queryText);
    const requestId = requestResult.lastInsertRowid;

    // Insert options
    const optionStmt = db.prepare(
      'INSERT INTO options (request_id, option_text, weight) VALUES (?, ?, ?)'
    );
    
    let optionsWithIds = [];
    options.forEach(opt => {
      const result = optionStmt.run(requestId, opt.text, opt.weight || 1.0);
      optionsWithIds.push({
        id: result.lastInsertRowid,
        text: opt.text,
        weight: opt.weight || 1.0
      });
    });

    // Get history if enabled
    let adjustedOptions = optionsWithIds;
    if (useHistoryAwareness) {
      const history = getDecisionHistory(db, userId, queryText, 30);
      const chosenIds = history.map(h => h.id);
      adjustedOptions = adjustWeightsBasedOnHistory(optionsWithIds, chosenIds);
    }

    // Make weighted random selection
    const chosenOption = weightedRandomSelect(adjustedOptions);

    // Record decision
    const decisionStmt = db.prepare(
      'INSERT INTO decisions (request_id, chosen_option_id) VALUES (?, ?)'
    );
    decisionStmt.run(requestId, chosenOption.id);

    return {
      requestId,
      chosenOption: {
        id: chosenOption.id,
        text: chosenOption.text
      },
      allOptions: optionsWithIds,
      adjustedWeights: useHistoryAwareness ? adjustedOptions : null
    };
  });

  return transaction();
};

module.exports = {
  adjustWeightsBasedOnHistory,
  weightedRandomSelect,
  getDecisionHistory,
  makeDecision
};
