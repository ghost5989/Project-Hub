'use strict';

const storage = require('../storage/storageManager');
const { generateId, slugify } = require('../utils/idGenerator');
const { sanitizeString, isNonEmptyString } = require('../utils/validators');

const NAME = 'categories';

async function getAll() {
  return storage.readCollection(NAME);
}

async function getById(id) {
  const all = await getAll();
  return all.find(c => c.id === id) || null;
}

async function create(body) {
  const name = sanitizeString(body.name, 80);
  const description = sanitizeString(body.description || '', 500);
  const slugInput = sanitizeString(body.slug || '', 80);
  if (!isNonEmptyString(name, 80)) return { error: 'name is required' };
  const all = await getAll();
  if (all.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    return { error: 'category name already exists' };
  }
  const slug = slugInput ? slugify(slugInput) : slugify(name);
  if (all.some(c => c.slug === slug)) {
    return { error: 'category slug already exists' };
  }
  const now = new Date().toISOString();
  const category = { id: generateId('cat'), name, slug, description, createdAt: now, updatedAt: now };
  all.push(category);
  await storage.writeCollection(NAME, all);
  return { category };
}

async function update(id, body) {
  const all = await getAll();
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) return { error: 'category not found' };
  const name = sanitizeString(body.name, 80);
  const description = sanitizeString(body.description || '', 500);
  const slugInput = sanitizeString(body.slug || '', 80);
  if (!isNonEmptyString(name, 80)) return { error: 'name is required' };
  const slug = slugInput ? slugify(slugInput) : slugify(name);
  if (all.some((c, i) => i !== idx && c.name.toLowerCase() === name.toLowerCase())) {
    return { error: 'category name already exists' };
  }
  if (all.some((c, i) => i !== idx && c.slug === slug)) {
    return { error: 'category slug already exists' };
  }
  const oldName = all[idx].name;
  all[idx] = { ...all[idx], name, slug, description, updatedAt: new Date().toISOString() };
  await storage.writeCollection(NAME, all);
  return { category: all[idx], oldName };
}

async function remove(id) {
  const all = await getAll();
  const filtered = all.filter(c => c.id !== id);
  if (filtered.length === all.length) return { error: 'category not found' };
  await storage.writeCollection(NAME, filtered);
  return { ok: true };
}

module.exports = { getAll, getById, create, update, remove };