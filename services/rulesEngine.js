const db = require('../database/db');
const InstagramService = require('./instagramService');

class RulesEngine {
  static normalizeText(text) {
    if (!text) return '';
    return text
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u0652]/g, '');
  }

  /**
   * Find matching rule for comment text & postId
   */
  static matchRule(commentText, postId = null) {
    const rules = db.getRules().filter(r => r.active);
    const normalizedComment = this.normalizeText(commentText);

    let wildcardRule = null;

    for (const rule of rules) {
      // 1. Post/Reel Specific Matching Check
      if (rule.targetPostId && rule.targetPostId.trim() !== '') {
        if (!postId || rule.targetPostId.trim() !== postId.trim()) {
          continue; // Rule is scoped to a specific post ID that doesn't match
        }
      }

      // Check for Wildcard / Catch-All
      if (rule.keywords.includes('*') || rule.matchType === 'wildcard') {
        wildcardRule = rule; // Save for fallback
        if (rule.targetPostId && postId && rule.targetPostId.trim() === postId.trim()) {
          return rule; // Post-specific wildcard matches immediately
        }
        continue;
      }

      // Keyword matching
      for (const rawKeyword of rule.keywords) {
        const normalizedKw = this.normalizeText(rawKeyword);
        if (!normalizedKw) continue;

        if (rule.matchType === 'exact') {
          if (normalizedComment === normalizedKw) {
            return rule;
          }
        } else {
          if (normalizedComment.includes(normalizedKw)) {
            return rule;
          }
        }
      }
    }

    // Return wildcard/catch-all if no specific keyword rule matched
    return wildcardRule;
  }

  static getRandomPublicReply(replies) {
    if (!replies || !Array.isArray(replies) || replies.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * replies.length);
    return replies[randomIndex];
  }

  /**
   * Process incoming comment
   */
  static async processComment({ commentId, username, commentText, postId = null, isSimulated = false }) {
    console.log(`[RULES ENGINE] Processing comment from @${username}: "${commentText}" (Post ID: ${postId || 'general'})`);

    const matchedRule = this.matchRule(commentText, postId);

    if (!matchedRule) {
      console.log(`[RULES ENGINE] No active rule matched for comment: "${commentText}"`);
      db.addLog({
        username,
        commentId,
        commentText,
        ruleMatched: 'لا توجد قاعدة مطابقة',
        autoLikeStatus: 'skipped',
        publicReplyStatus: 'skipped',
        dmStatus: 'skipped',
        simulated: isSimulated
      });
      return { matched: false, reason: 'No matching rule' };
    }

    console.log(`[RULES ENGINE] Matched rule: "${matchedRule.name}" [Action: ${matchedRule.actionType || 'all'}]`);

    db.incrementRuleTrigger(matchedRule.id);

    const actionType = matchedRule.actionType || 'all';
    const publicReplyText = this.getRandomPublicReply(matchedRule.publicReplies);
    const dmReplyContent = matchedRule.dmReply || { text: "" };

    let autoLikeStatus = 'skipped';
    let publicReplyStatus = 'skipped';
    let dmStatus = 'skipped';

    const settings = db.getSettings();

    // 1. Auto-Like Action
    if (matchedRule.autoLike && settings.autoLikeEnabled !== false) {
      const likeRes = await InstagramService.likeComment(commentId);
      autoLikeStatus = likeRes.success ? 'success' : 'failed';
    }

    // If actionType is 'like_only', stop here after like!
    if (actionType === 'like_only') {
      const logEntry = db.addLog({
        username,
        commentId,
        commentText,
        ruleMatched: `${matchedRule.name} (إعجاب فقط)`,
        autoLikeStatus,
        publicReplyText: null,
        publicReplyStatus: 'skipped',
        dmStatus: 'skipped',
        dmText: null,
        simulated: isSimulated
      });

      return {
        matched: true,
        ruleName: matchedRule.name,
        actionType: 'like_only',
        autoLikeStatus,
        publicReplyText: null,
        publicReplyStatus: 'skipped',
        dmStatus: 'skipped',
        logEntry
      };
    }

    // 2. Public Comment Reply
    if ((actionType === 'all' || actionType === 'comment_only') && publicReplyText) {
      const pubRes = await InstagramService.postPublicReply(commentId, publicReplyText);
      publicReplyStatus = pubRes.success ? 'success' : 'failed';
    }

    // 3. Private DM Reply
    if ((actionType === 'all' || actionType === 'dm_only') && dmReplyContent && (dmReplyContent.text || typeof dmReplyContent === 'string')) {
      const dmRes = await InstagramService.sendPrivateDmReply(commentId, dmReplyContent);
      dmStatus = dmRes.success ? 'success' : 'failed';
    }

    const logEntry = db.addLog({
      username,
      commentId,
      commentText,
      ruleMatched: matchedRule.name,
      autoLikeStatus,
      publicReplyText: (actionType === 'all' || actionType === 'comment_only') ? publicReplyText : null,
      publicReplyStatus,
      dmStatus,
      dmText: (actionType === 'all' || actionType === 'dm_only') ? (typeof dmReplyContent === 'string' ? dmReplyContent : dmReplyContent.text) : null,
      buttonText: typeof dmReplyContent === 'object' ? dmReplyContent.buttonText : null,
      buttonUrl: typeof dmReplyContent === 'object' ? dmReplyContent.buttonUrl : null,
      simulated: isSimulated
    });

    return {
      matched: true,
      ruleName: matchedRule.name,
      actionType,
      autoLikeStatus,
      publicReplyText: (actionType === 'all' || actionType === 'comment_only') ? publicReplyText : null,
      publicReplyStatus,
      dmStatus,
      dmReplyContent: (actionType === 'all' || actionType === 'dm_only') ? dmReplyContent : null,
      logEntry
    };
  }
}

module.exports = RulesEngine;
