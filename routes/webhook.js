const express = require('express');
const router = express.Router();
const db = require('../database/db');
const RulesEngine = require('../services/rulesEngine');

/**
 * GET /api/webhook
 * Meta Webhook Verification Endpoint
 */
router.get('/', (req, res) => {
  const settings = db.getSettings();
  const verifyToken = settings.webhookVerifyToken || 'my_custom_secret_verify_token_123';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[WEBHOOK VERIFIED] Meta webhook challenge accepted!');
      return res.status(200).send(challenge);
    } else {
      console.warn('[WEBHOOK ERROR] Token mismatch during verification!');
      return res.sendStatus(403);
    }
  }
  return res.status(400).send('Missing hub parameters');
});

/**
 * POST /api/webhook
 * Meta Webhook Receiver Endpoint for Instagram Comment Events
 */
router.post('/', async (req, res) => {
  const body = req.body;

  // Immediately respond 200 OK to Meta to acknowledge receipt
  res.status(200).send('EVENT_RECEIVED');

  if (body.object === 'instagram' || body.object === 'page') {
    if (Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        // Handle changes payload (Comments)
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === 'comments' || change.field === 'mentions') {
              const val = change.value;
              if (val && val.text) {
                const commentId = val.id || ('comment_' + Date.now());
                const username = (val.from && val.from.username) ? val.from.username : (val.username || 'زائر انستغرام');
                const commentText = val.text;

                // Process comment asynchronously
                await RulesEngine.processComment({
                  commentId,
                  username,
                  commentText,
                  isSimulated: false
                });
              }
            }
          }
        }
      }
    }
  }
});

module.exports = router;
