'use strict';

const path = require('path');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me-please-32ch';

// Fail fast in production if SESSION_SECRET is weak or missing
if (isProd) {
  const isWeak =
    !process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32 ||
    process.env.SESSION_SECRET.includes('change-me') ||
    process.env.SESSION_SECRET.includes('dev-only');
  if (isWeak) {
    console.error('[config] FATAL: SESSION_SECRET must be set to a strong random value (>= 32 chars) in production.');
    process.exit(1);
  }
  if (!process.env.OWNER_PASSWORD || process.env.OWNER_PASSWORD === 'admin') {
    console.warn('[config] WARNING: OWNER_PASSWORD is weak or default. Change it in .env before exposing the app.');
  }
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  env: process.env.NODE_ENV || 'development',
  isProd,

  session: {
    secret: sessionSecret,
    cookieName: 'phub_sid',
    maxAgeHours: parseInt(process.env.SESSION_MAX_AGE_HOURS, 10) || 24
  },

  owner: {
    username: process.env.OWNER_USERNAME || 'admin',
    password: process.env.OWNER_PASSWORD || 'admin',
    email: process.env.OWNER_EMAIL || 'admin@projecthub.local'
  },

  github: {
    fallbackPassword: process.env.GITHUB_ACCESS_PASSWORD || ''
  },

  paths: {
    public: path.join(__dirname, '..', 'public'),
    data: path.join(__dirname, 'storage', 'data')
  }
};

module.exports = config;