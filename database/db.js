const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

// Default initial data structure
const defaultData = {
  settings: {
    instagramAccountId: "17841413935836206",
    pageAccessToken: "",
    webhookVerifyToken: "my_custom_secret_verify_token_123",
    autoLikeEnabled: true,
    randomizeDelay: true,
    minDelaySeconds: 2,
    maxDelaySeconds: 5,
    metaApiVersion: "v19.0",
    globalCatchAllEnabled: false,
    globalCatchAllReply: "أهلاً بك 🌸! شرفتنا بتعليقك وسعداء بتواجدك معنا ✨"
  },
  rules: [
    {
      id: "rule_global_catchall",
      name: "الرد العام التلقائي الشامل لكافة التعليقات",
      keywords: ["*"],
      matchType: "wildcard",
      targetPostId: "", // Empty means all posts
      actionType: "all", // 'all', 'like_only', 'comment_only', 'dm_only'
      autoLike: true,
      publicReplies: [
        "أهلاً بك 🌸! شرفتنا بتعليقك وسعداء بتواجدك معنا ✨",
        "مرحباً عزيزي! تم استلام استفسارك وسيتم التواصل معك فوراً 📩"
      ],
      dmReply: {
        text: "أهلاً بك 🌸! يسعدنا تواصلك معنا، كيف يمكننا خدمتك اليوم؟",
        buttonText: "💬 تواصل مع خدمة العملاء",
        buttonUrl: "https://example.com/support"
      },
      active: false,
      triggerCount: 5
    },
    {
      id: "rule_post_reel_specific",
      name: "رد خاص بريلز العروض الترويجية (Reel #101)",
      keywords: ["عروض", "خصم", "تفاصيل"],
      matchType: "contains",
      targetPostId: "reel_101", // Post or Reel ID
      actionType: "all",
      autoLike: true,
      publicReplies: [
        "أهلاً بك! هذا الريلز يشمله خصم 30% 🎁 التفاصيل بالخاص 📩"
      ],
      dmReply: {
        text: "خصم خاص 30% لمتابعي هذا الريلز 🎉! استخدم كود الخصم: REEL30 عند الطلب.",
        buttonText: "🎁 تطبيق الخصم فوراً",
        buttonUrl: "https://example.com/reel-offer"
      },
      active: true,
      triggerCount: 12
    },
    {
      id: "rule_like_only_demo",
      name: "إعجاب فقط بدون رد (Like Only)",
      keywords: ["شكرا", "جميل", "رائع", "منور", "❤️", "👍"],
      matchType: "contains",
      targetPostId: "",
      actionType: "like_only", // Only auto-like
      autoLike: true,
      publicReplies: [],
      dmReply: { text: "" },
      active: true,
      triggerCount: 18
    },
    {
      id: "rule_default_price",
      name: "استفسار عن السعر",
      keywords: ["سعر", "بكم", "السعر", "بكم هذا", "كم سعر", "cost", "price"],
      matchType: "contains",
      targetPostId: "",
      actionType: "all",
      autoLike: true,
      publicReplies: [
        "أهلاً بك! 🌸 تم إرسال جميع التفاصيل والسعر في الخاص 📩",
        "مرحباً عزيزي! أرسلنا لك السعر ورابط الطلب في الرسائل الخاصة 📥",
        "تفضل بتفقد رسائلك الخاصة (DM) للحصول على كامل التفاصيل 📨"
      ],
      dmReply: {
        text: "أهلاً وسهلاً بك 🌸! سعر هذا المنتج 150 ريال شامل الضريبة 💸.\nيمكنك الطلب مباشرة من الرابط التالي:",
        buttonText: "🛒 رابط الطلب المباشر",
        buttonUrl: "https://example.com/checkout"
      },
      active: true,
      triggerCount: 14
    }
  ],
  logs: [
    {
      id: "log_101",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      username: "sarah_k",
      commentId: "1790123456789",
      commentText: "ممكن أعرف كم السعر مع الشحن؟",
      ruleMatched: "استفسار عن السعر",
      autoLikeStatus: "success",
      publicReplyText: "أهلاً بك! 🌸 تم إرسال جميع التفاصيل والسعر في الخاص 📩",
      publicReplyStatus: "success",
      dmStatus: "success",
      dmText: "أهلاً وسهلاً بك 🌸! سعر هذا المنتج 150 ريال شامل الضريبة 💸.",
      simulated: true
    }
  ],
  stats: {
    totalComments: 46,
    totalLikes: 46,
    totalPublicReplies: 46,
    totalDmsSent: 46
  }
};

function readData() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeData(defaultData);
      return defaultData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB:', err);
    return defaultData;
  }
}

function writeData(data) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

const db = {
  getSettings: () => {
    const data = readData();
    return data.settings || defaultData.settings;
  },

  updateSettings: (newSettings) => {
    const data = readData();
    data.settings = { ...data.settings, ...newSettings };
    writeData(data);
    return data.settings;
  },

  getRules: () => {
    const data = readData();
    return data.rules || [];
  },

  getRuleById: (id) => {
    const rules = db.getRules();
    return rules.find(r => r.id === id);
  },

  saveRule: (ruleData) => {
    const data = readData();
    if (!data.rules) data.rules = [];
    
    if (ruleData.id) {
      const index = data.rules.findIndex(r => r.id === ruleData.id);
      if (index !== -1) {
        data.rules[index] = { ...data.rules[index], ...ruleData };
      } else {
        data.rules.push(ruleData);
      }
    } else {
      ruleData.id = 'rule_' + Date.now();
      ruleData.triggerCount = 0;
      data.rules.push(ruleData);
    }
    writeData(data);
    return ruleData;
  },

  deleteRule: (id) => {
    const data = readData();
    data.rules = (data.rules || []).filter(r => r.id !== id);
    writeData(data);
    return true;
  },

  incrementRuleTrigger: (id) => {
    const data = readData();
    const rule = (data.rules || []).find(r => r.id === id);
    if (rule) {
      rule.triggerCount = (rule.triggerCount || 0) + 1;
      writeData(data);
    }
  },

  addLog: (logEntry) => {
    const data = readData();
    if (!data.logs) data.logs = [];
    if (!data.stats) data.stats = { totalComments: 0, totalLikes: 0, totalPublicReplies: 0, totalDmsSent: 0 };

    logEntry.id = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    logEntry.timestamp = new Date().toISOString();
    
    data.logs.unshift(logEntry);
    if (data.logs.length > 500) {
      data.logs = data.logs.slice(0, 500);
    }

    data.stats.totalComments = (data.stats.totalComments || 0) + 1;
    if (logEntry.autoLikeStatus === 'success') data.stats.totalLikes = (data.stats.totalLikes || 0) + 1;
    if (logEntry.publicReplyStatus === 'success') data.stats.totalPublicReplies = (data.stats.totalPublicReplies || 0) + 1;
    if (logEntry.dmStatus === 'success') data.stats.totalDmsSent = (data.stats.totalDmsSent || 0) + 1;

    writeData(data);
    return logEntry;
  },

  getLogs: (limit = 50) => {
    const data = readData();
    return (data.logs || []).slice(0, limit);
  },

  clearLogs: () => {
    const data = readData();
    data.logs = [];
    writeData(data);
    return true;
  },

  getStats: () => {
    const data = readData();
    const rules = data.rules || [];
    const stats = data.stats || { totalComments: 0, totalLikes: 0, totalPublicReplies: 0, totalDmsSent: 0 };

    const keywordUsage = {};
    rules.forEach(r => {
      if (r.keywords && Array.isArray(r.keywords)) {
        r.keywords.forEach(kw => {
          keywordUsage[kw] = (keywordUsage[kw] || 0) + (r.triggerCount || 0);
        });
      }
    });

    return {
      ...stats,
      activeRulesCount: rules.filter(r => r.active).length,
      totalRulesCount: rules.length,
      keywordUsage
    };
  }
};

module.exports = db;
