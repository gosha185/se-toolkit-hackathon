const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const db = require('../database');
const randomizer = require('../utils/randomizer');

// Create a decision
router.post('/', authenticateToken, (req, res) => {
  try {
    const { query, options, useHistoryAwareness } = req.body;

    if (!query || !options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({ 
        error: 'Query and options array are required' 
      });
    }

    // Validate options
    for (const opt of options) {
      if (!opt.text || typeof opt.text !== 'string') {
        return res.status(400).json({ 
          error: 'Each option must have a text field' 
        });
      }
      if (opt.weight !== undefined && (typeof opt.weight !== 'number' || opt.weight < 0)) {
        return res.status(400).json({ 
          error: 'Option weight must be a non-negative number' 
        });
      }
    }

    const result = randomizer.makeDecision(
      db.getDb(),
      req.user.id,
      query,
      options,
      useHistoryAwareness !== false // Default to true
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Decision creation error:', error);
    res.status(500).json({ error: 'Failed to make decision' });
  }
});

// Get user's decision history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const { limit = 20, offset = 0, query } = req.query;
    
    let stmt;
    let params;

    if (query) {
      stmt = db.getDb().prepare(`
        SELECT dr.id, dr.query_text, dr.created_at,
               o.option_text as chosen_option,
               COUNT(o2.id) as total_options
        FROM decision_requests dr
        JOIN decisions d ON dr.id = d.request_id
        JOIN options o ON d.chosen_option_id = o.id
        LEFT JOIN options o2 ON dr.id = o2.request_id
        WHERE dr.user_id = ? AND dr.query_text LIKE ?
        GROUP BY dr.id
        ORDER BY dr.created_at DESC
        LIMIT ? OFFSET ?
      `);
      params = [req.user.id, `%${query}%`, parseInt(limit), parseInt(offset)];
    } else {
      stmt = db.getDb().prepare(`
        SELECT dr.id, dr.query_text, dr.created_at,
               o.option_text as chosen_option,
               COUNT(o2.id) as total_options
        FROM decision_requests dr
        JOIN decisions d ON dr.id = d.request_id
        JOIN options o ON d.chosen_option_id = o.id
        LEFT JOIN options o2 ON dr.id = o2.request_id
        WHERE dr.user_id = ?
        GROUP BY dr.id
        ORDER BY dr.created_at DESC
        LIMIT ? OFFSET ?
      `);
      params = [req.user.id, parseInt(limit), parseInt(offset)];
    }

    const history = stmt.all(...params);

    // Get total count
    const countStmt = db.getDb().prepare(
      'SELECT COUNT(*) as total FROM decision_requests WHERE user_id = ?' + 
      (query ? ' AND query_text LIKE ?' : '')
    );
    const totalCount = query 
      ? countStmt.get(req.user.id, `%${query}%`)
      : countStmt.get(req.user.id);

    res.json({
      history,
      total: totalCount.total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get decision history' });
  }
});

// Get details of a specific decision
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const decisionId = parseInt(req.params.id);

    const stmt = db.getDb().prepare(`
      SELECT dr.id, dr.query_text, dr.created_at,
             o.option_text as chosen_option, o.id as chosen_option_id,
             o2.id as option_id, o2.option_text, o2.weight,
             o2.was_chosen
      FROM decision_requests dr
      JOIN decisions d ON dr.id = d.request_id
      JOIN options o ON d.chosen_option_id = o.id
      JOIN options o2 ON dr.id = o2.request_id
      WHERE dr.id = ? AND dr.user_id = ?
    `);

    const rows = stmt.all(decisionId, req.user.id);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    const decision = {
      id: rows[0].id,
      query: rows[0].query_text,
      createdAt: rows[0].created_at,
      chosenOption: rows[0].chosen_option,
      options: rows.map(row => ({
        id: row.option_id,
        text: row.option_text,
        weight: row.weight,
        wasChosen: row.was_chosen === 1
      }))
    };

    res.json(decision);
  } catch (error) {
    console.error('Get decision details error:', error);
    res.status(500).json({ error: 'Failed to get decision details' });
  }
});

// Get decision statistics
router.get('/stats/summary', authenticateToken, (req, res) => {
  try {
    const stmt = db.getDb().prepare(`
      SELECT 
        COUNT(DISTINCT dr.id) as total_decisions,
        COUNT(DISTINCT dr.query_text) as unique_queries,
        MIN(dr.created_at) as first_decision,
        MAX(dr.created_at) as last_decision
      FROM decision_requests dr
      WHERE dr.user_id = ?
    `);

    const stats = stmt.get(req.user.id);

    // Get most frequent queries
    const freqStmt = db.getDb().prepare(`
      SELECT query_text, COUNT(*) as count
      FROM decision_requests
      WHERE user_id = ?
      GROUP BY query_text
      ORDER BY count DESC
      LIMIT 10
    `);
    const frequentQueries = freqStmt.all(req.user.id);

    res.json({
      ...stats,
      frequentQueries
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;
