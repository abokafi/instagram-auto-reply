const express = require('express');
const router = express.Router();
const db = require('../database/db');
const RulesEngine = require('../services/rulesEngine');

// RULES CRUD
router.get('/rules', (req, res) => {
  res.json({ success: true, rules: db.getRules() });
});

router.post('/rules', (req, res) => {
  const ruleData = req.body;
  if (!ruleData.name || !ruleData.keywords || !Array.isArray(ruleData.keywords)) {
    return res.status(400).json({ success: false, error: 'الرجاء إدخال اسم القاعدة والكلمات المفتاحية' });
  }
  const savedRule = db.saveRule(ruleData);
  res.json({ success: true, rule: savedRule });
});

router.put('/rules/:id', (req, res) => {
  const ruleData = req.body;
  ruleData.id = req.params.id;
  const updatedRule = db.saveRule(ruleData);
  res.json({ success: true, rule: updatedRule });
});

router.delete('/rules/:id', (req, res) => {
  db.deleteRule(req.params.id);
  res.json({ success: true });
});

// SETTINGS
router.get('/settings', (req, res) => {
  res.json({ success: true, settings: db.getSettings() });
});

router.post('/settings', (req, res) => {
  const newSettings = db.updateSettings(req.body);
  res.json({ success: true, settings: newSettings });
});

// LOGS & STATS
router.get('/logs', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;
  res.json({ success: true, logs: db.getLogs(limit) });
});

router.delete('/logs', (req, res) => {
  db.clearLogs();
  res.json({ success: true });
});

router.get('/stats', (req, res) => {
  res.json({ success: true, stats: db.getStats() });
});

// SIMULATION ENDPOINT
router.post('/simulate', async (req, res) => {
  const { username, commentText, postId } = req.body;
  if (!commentText) {
    return res.status(400).json({ success: false, error: 'الرجاء إدخال نص التعليق للتجربة' });
  }

  const commentId = 'sim_' + Date.now();
  const simUsername = username || 'user_demo';

  const result = await RulesEngine.processComment({
    commentId,
    username: simUsername,
    commentText,
    postId: postId || null,
    isSimulated: true
  });

  res.json({
    success: true,
    result
  });
});

module.exports = router;
