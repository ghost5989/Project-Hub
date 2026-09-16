'use strict';

const crypto = require('crypto');

function generateId(prefix) {
  const rand = crypto.randomBytes(8).toString('hex');
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'item';
}

module.exports = { generateId, slugify };