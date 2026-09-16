'use strict';

const contactService = require('../services/contactService');

async function submit(req, res) {
  const result = await contactService.submit(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json({ ok: true, id: result.id });
}

module.exports = { submit };