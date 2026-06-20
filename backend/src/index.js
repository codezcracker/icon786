const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const serveFrontend = isProd && fs.existsSync(frontendDist);

const iconRoutes = require('./routes/icons');
const exportRoutes = require('./routes/export');
const fontRoutes = require('./routes/font');

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
    },
  },
}));
const corsOrigins = ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean);
if (!serveFrontend) {
  app.use(cors({ origin: corsOrigins.length ? corsOrigins : true }));
}
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
    name: 'Icon786 API',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// API 404
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Production: serve React build from the same server
if (serveFrontend) {
  app.use(express.static(frontendDist, { maxAge: '1d', index: false }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Icon786 running at http://localhost:${PORT}`);
  if (serveFrontend) console.log('📦 Serving frontend from frontend/dist');
  console.log(`📖 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗂  Icons: @icon786/icons (${require('./data/permissive-prefixes.json').setCount} sets, lazy search)\n`);
});
