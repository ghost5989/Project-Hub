'use strict';

const settingsService = require('../services/settingsService');
const { isValidUrl } = require('../utils/validators');

async function get(req, res) {
  const settings = await settingsService.getSettings();
  res.json({ settings });
}

async function update(req, res) {
  // Basic URL validation
  for (const field of ['githubUrl', 'linkedinUrl', 'instagramUrl']) {
    if (req.body[field] && !isValidUrl(req.body[field])) {
      return res.status(400).json({ error: `${field} must be a valid URL` });
    }
  }
  const settings = await settingsService.updateSettings(req.body);
  res.json({ settings });
}

module.exports = { get, update };