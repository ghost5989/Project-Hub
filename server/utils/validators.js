'use strict';

function isNonEmptyString(v, max = 5000) {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

function isValidEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254;
}

function isValidUrl(v) {
  if (typeof v !== 'string' || v.length > 2048) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function isValidSlug(v) {
  return typeof v === 'string' && /^[a-z0-9-]{1,80}$/.test(v);
}

function isValidId(v) {
  return typeof v === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(v);
}

function sanitizeString(v, max = 5000) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isValidUrl,
  isValidSlug,
  isValidId,
  sanitizeString
};