'use strict';

const config = require('../config');

function notFound(req, res) {
  res.status(404).json({ error: 'not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = config.isProd && status === 500
    ? 'internal server error'
    : (err.message || 'internal server error');
  if (status >= 500) {
    console.error('[error]', err);
  }
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };