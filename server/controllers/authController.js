'use strict';

const authService = require('../services/authService');
const { createSessionToken } = require('../utils/crypto');
const config = require('../config');
const { sanitizeString, isValidEmail, isNonEmptyString } = require('../utils/validators');

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.isProd,
    maxAge: config.session.maxAgeHours * 60 * 60 * 1000,
    path: '/'
  };
}

async function login(req, res) {
  const username = sanitizeString(req.body.username, 80);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!isNonEmptyString(username, 80) || !isNonEmptyString(password, 200)) {
    return res.status(400).json({ error: 'username and password required' });
  }
  const user = await authService.verifyCredentials(username, password);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const token = createSessionToken({
    sub: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + config.session.maxAgeHours * 60 * 60 * 1000
  });
  res.cookie(config.session.cookieName, token, cookieOptions());
  res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
}

async function logout(req, res) {
  res.clearCookie(config.session.cookieName, { path: '/' });
  res.json({ ok: true });
}

async function me(req, res) {
  if (!req.session) return res.status(401).json({ error: 'not authenticated' });
  const user = await authService.findById(req.session.sub);
  if (!user) return res.status(401).json({ error: 'not authenticated' });
  res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
}

async function updateProfile(req, res) {
  const email = sanitizeString(req.body.email || '', 254);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (email && !isValidEmail(email)) return res.status(400).json({ error: 'invalid email' });
  if (password && password.length < 6) return res.status(400).json({ error: 'password too short' });
  const updated = await authService.updateProfile(req.session.sub, { email, password });
  if (!updated) return res.status(404).json({ error: 'user not found' });
  res.json({ user: updated });
}

module.exports = { login, logout, me, updateProfile };