const db = require('../database/db');

/**
 * Service to interact with official Meta Graph API for Instagram
 * Official Endpoints Reference:
 * - Reply to Comment: POST https://graph.facebook.com/v19.0/{comment_id}/replies
 * - Private DM Reply to Comment: POST https://graph.facebook.com/v19.0/{ig_page_id}/messages
 *   Payload: { "recipient": { "comment_id": comment_id }, "message": { "text": message_text } }
 * - Hide/Like Comment: POST https://graph.facebook.com/v19.0/{comment_id}
 */

class InstagramService {
  /**
   * Send Auto-Like to a comment
   */
  static async likeComment(commentId) {
    const settings = db.getSettings();
    const token = settings.pageAccessToken;
    const version = settings.metaApiVersion || 'v19.0';

    // If no access token configured or simulated ID, return success simulation
    if (!token || commentId.startsWith('sim_')) {
      console.log(`[SIMULATION] Liked comment ${commentId}`);
      return { success: true, simulated: true };
    }

    try {
      const url = `https://graph.facebook.com/${version}/${commentId}?hide=false&access_token=${token}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (data.error) {
        console.error('[META API ERROR] Like Comment:', data.error);
        return { success: false, error: data.error.message };
      }
      return { success: true, data };
    } catch (err) {
      console.error('[NET ERROR] Like Comment:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Post a public comment reply under an Instagram post
   */
  static async postPublicReply(commentId, messageText) {
    const settings = db.getSettings();
    const token = settings.pageAccessToken;
    const version = settings.metaApiVersion || 'v19.0';

    if (!token || commentId.startsWith('sim_')) {
      console.log(`[SIMULATION] Public reply to ${commentId}: "${messageText}"`);
      return { success: true, simulated: true, replyText: messageText };
    }

    try {
      const url = `https://graph.facebook.com/${version}/${commentId}/replies`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          access_token: token
        })
      });
      const data = await response.json();

      if (data.error) {
        console.error('[META API ERROR] Public Reply:', data.error);
        return { success: false, error: data.error.message };
      }
      return { success: true, replyId: data.id, replyText: messageText };
    } catch (err) {
      console.error('[NET ERROR] Public Reply:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send a Private DM (Direct Message) reply to a commenter
   */
  static async sendPrivateDmReply(commentId, dmContent) {
    const settings = db.getSettings();
    const token = settings.pageAccessToken;
    const igAccountId = settings.instagramAccountId;
    const version = settings.metaApiVersion || 'v19.0';

    const textMessage = typeof dmContent === 'string' ? dmContent : (dmContent.text || '');
    const buttonText = typeof dmContent === 'object' ? dmContent.buttonText : null;
    const buttonUrl = typeof dmContent === 'object' ? dmContent.buttonUrl : null;

    if (!token || !igAccountId || commentId.startsWith('sim_')) {
      console.log(`[SIMULATION] Sent Private DM for comment ${commentId}: "${textMessage}"`);
      return { 
        success: true, 
        simulated: true, 
        dmText: textMessage,
        buttonText,
        buttonUrl
      };
    }

    try {
      const url = `https://graph.facebook.com/${version}/${igAccountId}/messages`;
      
      let messagePayload;
      if (buttonText && buttonUrl) {
        // Send structured generic template button message
        messagePayload = {
          recipient: { comment_id: commentId },
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "generic",
                elements: [{
                  title: "تفاصيل استفسارك 🌸",
                  subtitle: textMessage.substring(0, 80),
                  buttons: [{
                    type: "web_url",
                    url: buttonUrl,
                    title: buttonText.substring(0, 20)
                  }]
                }]
              }
            }
          }
        };
      } else {
        // Standard text DM
        messagePayload = {
          recipient: { comment_id: commentId },
          message: { text: textMessage }
        };
      }

      const response = await fetch(`${url}?access_token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messagePayload)
      });
      const data = await response.json();

      if (data.error) {
        console.error('[META API ERROR] Send DM Reply:', data.error);
        return { success: false, error: data.error.message };
      }
      return { success: true, messageId: data.message_id, dmText: textMessage };
    } catch (err) {
      console.error('[NET ERROR] Send DM Reply:', err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = InstagramService;
