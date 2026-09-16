'use strict';

const settingsService = require('../services/settingsService');
const { isValidUrl } = require('../utils/validators');

async function get(req, res) {
  const settings = await settingsService.getSettings();
  res.json({ settings });
}

async function update(req, res) {
  // URL validation for profile links and hero image
  const urlFields = ['githubUrl', 'linkedinUrl', 'instagramUrl', 'heroImageUrl'];
  for (let i = 0; i < urlFields.length; i++) {
    const field = urlFields[i];
    const val = req.body[field];
    // heroImageUrl can be empty string (means "use default"); others must be valid if present
    if (field === 'heroImageUrl') {
      if (typeof val === 'string' && val.trim() && !isValidUrl(val)) {
        return res.status(400).json({ error: 'heroImageUrl must be a valid URL' });
      }
    } else if (val && !isValidUrl(val)) {
      return res.status(400).json({ error: field + ' must be a valid URL' });
    }
  }
  const settings = await settingsService.updateSettings(req.body);
  res.json({ settings });
}

module.exports = { get: get, update: update };
