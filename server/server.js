'use strict';

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const config = require('./config');
const storage = require('./storage/storageManager');
const authService = require('./services/authService');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const contactRoutes = require('./routes/contactRoutes');
const githubRoutes = require('./routes/githubRoutes');
const publicRoutes = require('./routes/publicRoutes');
const healthRoutes = require('./routes/healthRoutes');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"], // inline handlers exist in preserved HTML
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": ["'self'"],
      "frame-ancestors": ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));
app.use(cookieParser(config.session.secret));

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/public-data', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/github', githubRoutes);

// Static frontend
app.use(express.static(config.paths.public, {
  extensions: ['html'],
  maxAge: config.isProd ? '1h' : 0
}));

// SPA fallback for non-API GET requests
app.get(/^(?!\/api).*/, (req, res, next) => {
  res.sendFile(path.join(config.paths.public, 'index.html'), err => {
    if (err) next(err);
  });
});

app.use('/api', notFound);
app.use(notFound);
app.use(errorHandler);

async function start() {
  storage.ensureDir();
  await authService.seedOwnerIfMissing();

  app.listen(config.port, () => {
    console.log(`[server] Project Hub running on port ${config.port} (${config.env})`);
  });
}

start().catch(err => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});

module.exports = app;