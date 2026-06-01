const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const iconRoutes = require('./routes/icons');
const exportRoutes = require('./routes/export');
const fontRoutes = require('./routes/font');

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean) }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Routes
app.use('/api/icons', iconRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/font', fontRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'IconVault API',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 IconVault API running at http://localhost:${PORT}`);
  console.log(`📖 Health check: http://localhost:${PORT}/api/health\n`);
});
