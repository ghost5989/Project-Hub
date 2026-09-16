'use strict';

const storage = require('../storage/storageManager');
const { generateId } = require('../utils/idGenerator');
const { sanitizeString, isValidEmail, isNonEmptyString } = require('../utils/validators');

const NAME = 'contacts';

async function submit({ name, email, message }) {
  const cleanName = sanitizeString(name, 120);
  const cleanEmail = sanitizeString(email, 254);
  const cleanMessage = sanitizeString(message, 4000);

  const errors = [];
  if (!isNonEmptyString(cleanName, 120)) errors.push('name is required');
  if (!isValidEmail(cleanEmail)) errors.push('email is invalid');
  if (!isNonEmptyString(cleanMessage, 4000)) errors.push('message is required');
  if (errors.length) return { error: errors.join('; ') };

  const contacts = await storage.readCollection(NAME);
  const record = {
    id: generateId('msg'),
    name: cleanName,
    email: cleanEmail,
    message: cleanMessage,
    createdAt: new Date().toISOString()
  };
  contacts.unshift(record);
  // Cap at 500 records to avoid unbounded growth
  if (contacts.length > 500) contacts.length = 500;
  await storage.writeCollection(NAME, contacts);
  return { id: record.id };
}

module.exports = { submit };