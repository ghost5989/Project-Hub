'use strict';

const githubService = require('../services/githubService');

async function verify(req, res) {
  const projectId = typeof req.body.projectId === 'string' ? req.body.projectId : null;
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const result = await githubService.verifyAccess({ projectId, enteredPassword: password });
  if (!result.ok) {
    return res.status(401).json({ error: result.error || 'access denied' });
  }
  res.json({ ok: true, url: result.url });
}

module.exports = { verify };