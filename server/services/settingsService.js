'use strict';

const storage = require('../storage/storageManager');
const { sanitizeString } = require('../utils/validators');

const NAME = 'settings';

const DEFAULTS = {
  siteName: 'Project Hub',
  siteDescription: 'Explore innovative projects, discover talented developers, and get inspired by the best work in the community.',
  ownerDisplayName: 'Admin',
  footerText: '© 2025 Project Hub. All rights reserved.',
  githubUrl: 'https://github.com/',
  githubPassword: '',
  linkedinUrl: 'https://linkedin.com/',
  instagramUrl: 'https://instagram.com/',
  contactEmail: 'hello@projecthub.dev',
  defaultTheme: 'dark'
};

async function getSettings() {
  const stored = await storage.readObject(NAME, {});
  return Object.assign({}, DEFAULTS, stored);
}

async function updateSettings(payload) {
  const current = await getSettings();
  const next = Object.assign({}, current);

  const strFields = ['siteName', 'siteDescription', 'ownerDisplayName', 'footerText'];
  for (let i = 0; i < strFields.length; i++) {
    const f = strFields[i];
    if (typeof payload[f] === 'string') next[f] = sanitizeString(payload[f], 500);
  }

  const urlFields = ['githubUrl', 'linkedinUrl', 'instagramUrl'];
  for (let i = 0; i < urlFields.length; i++) {
    const f = urlFields[i];
    if (typeof payload[f] === 'string' && payload[f].trim()) {
      next[f] = sanitizeString(payload[f], 2048);
    }
  }

  if (typeof payload.contactEmail === 'string') {
    next.contactEmail = sanitizeString(payload.contactEmail, 254);
  }

  // Global GitHub access password (footer). Stored server-side. Never returned via public API.
  if (typeof payload.githubPassword === 'string') {
    next.githubPassword = sanitizeString(payload.githubPassword, 200);
  }

  if (payload.defaultTheme === 'dark' || payload.defaultTheme === 'light') {
    next.defaultTheme = payload.defaultTheme;
  }

  await storage.writeObject(NAME, next);
  return next;
}

// Public subset: strips server-side secrets before sending to unauthenticated clients.
async function getPublicSettings() {
  const s = await getSettings();
  const safe = Object.assign({}, s);
  delete safe.githubPassword;
  return safe;
}

module.exports = {
  getSettings: getSettings,
  getPublicSettings: getPublicSettings,
  updateSettings: updateSettings
};