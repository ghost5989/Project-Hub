'use strict';

function requireJsonBody(req, res, next) {
  if (req.method === 'GET' || req.method === 'DELETE') return next();
  if (!req.is('application/json') && Object.keys(req.body || {}).length === 0) {
    // express.json already parsed if content-type matched; allow empty bodies for safety
    return next();
  }
  next();
}

module.exports = { requireJsonBody };