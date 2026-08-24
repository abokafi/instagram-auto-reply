const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhook');

app.use('/api/webhook', webhookRoutes);
app.use('/api', apiRoutes);

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`
  ======================================================
  🚀 نظام الرد الآلي على انستغرام يعمل بنجاح!
  🌐 رابط اللوحة المحلية: http://localhost:${PORT}
  🔗 رابط الويب هوك الخاص بـ Meta: http://localhost:${PORT}/api/webhook
  ======================================================
  `);
});
