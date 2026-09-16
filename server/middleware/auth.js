'use strict';

const { verifySessionToken } = require('../utils/crypto');
const config = require('../config');

function getSessionFromReq(req) {
  const token = req.cookies ? req.cookies[config.session.cookieName] : null;
  return verifySessionToken(token);
}

function requireAuth(req, res, next) {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: 'authentication required' });
  }
  req.session = session;
  next();
}

function attachSession(req, res, next) {
  req.session = getSessionFromReq(req);
  next();
}

module.exports = { requireAuth, attachSession, getSessionFromReq };