'use strict';

const storage = require('../storage/storageManager');
const { generateId, slugify } = require('../utils/idGenerator');
const {
  sanitizeString,
  isValidUrl,
  isNonEmptyString
} = require('../utils/validators');

const NAME = 'projects';

const STATUSES = ['active', 'archived'];
const VISIBILITIES = ['published', 'draft', 'hidden'];

function normalizeProjectInput(body, categories) {
  const title = sanitizeString(body.title, 200);
  const description = sanitizeString(body.description, 2000);
  const category = sanitizeString(body.category, 80);
  const liveUrl = sanitizeString(body.liveUrl, 2048);
  const githubUrl = sanitizeString(body.githubUrl, 2048);
  const githubPassword = sanitizeString(body.githubPassword || '', 200);
  const image = sanitizeString(body.image || '', 2048);
  const status = STATUSES.includes(body.status) ? body.status : 'active';
  const visibility = VISIBILITIES.includes(body.visibility) ? body.visibility : 'published';

  let tags = [];
  if (Array.isArray(body.tags)) {
    tags = body.tags.map(t => sanitizeString(t, 40)).filter(Boolean).slice(0, 20);
  } else if (typeof body.tags === 'string') {
    tags = body.tags.split(',').map(t => sanitizeString(t, 40)).filter(Boolean).slice(0, 20);
  }

  const errors = [];
  if (!isNonEmptyString(title, 200)) errors.push('title is required');
  if (!isNonEmptyString(description, 2000)) errors.push('description is required');
  if (!isNonEmptyString(category, 80)) errors.push('category is required');
  if (category && categories && !categories.some(c => c.name === category)) {
    errors.push('category does not exist');
  }
  if (!liveUrl || !isValidUrl(liveUrl)) errors.push('liveUrl must be a valid http(s) URL');
  if (!githubUrl || !isValidUrl(githubUrl)) errors.push('githubUrl must be a valid http(s) URL');
  if (image && !isValidUrl(image)) errors.push('image must be a valid http(s) URL');

  return {
    errors,
    value: { title, description, category, liveUrl, githubUrl, githubPassword, image, tags, status, visibility }
  };
}

async function getAll() {
  return storage.readCollection(NAME);
}

async function getPublished() {
  const all = await getAll();
  return all.filter(p => p.visibility === 'published');
}

async function getById(id) {
  const all = await getAll();
  return all.find(p => p.id === id) || null;
}

async function create(body, categories) {
  const { errors, value } = normalizeProjectInput(body, categories);
  if (errors.length) return { error: errors.join('; ') };
  const all = await getAll();
  const now = new Date().toISOString();
  const project = {
    id: generateId('proj'),
    slug: slugify(value.title),
    title: value.title,
    description: value.description,
    category: value.category,
    liveUrl: value.liveUrl,
    githubUrl: value.githubUrl,
    githubPassword: value.githubPassword,
    image: value.image,
    tags: value.tags,
    status: value.status,
    visibility: value.visibility,
    createdAt: now,
    updatedAt: now
  };
  all.unshift(project);
  await storage.writeCollection(NAME, all);
  return { project };
}

async function update(id, body, categories) {
  const all = await getAll();
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) return { error: 'project not found' };
  const { errors, value } = normalizeProjectInput({ ...all[idx], ...body }, categories);
  if (errors.length) return { error: errors.join('; ') };
  all[idx] = {
    ...all[idx],
    ...value,
    slug: slugify(value.title),
    updatedAt: new Date().toISOString()
  };
  await storage.writeCollection(NAME, all);
  return { project: all[idx] };
}

async function remove(id) {
  const all = await getAll();
  const filtered = all.filter(p => p.id !== id);
  if (filtered.length === all.length) return { error: 'project not found' };
  await storage.writeCollection(NAME, filtered);
  return { ok: true };
}

// Public view: strips GitHub password from output
function toPublic(project) {
  const { githubPassword, ...rest } = project;
  return { ...rest, hasGithubPassword: Boolean(githubPassword && githubPassword.trim()) };
}

module.exports = { getAll, getPublished, getById, create, update, remove, toPublic, STATUSES, VISIBILITIES };