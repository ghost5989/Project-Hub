'use strict';

const categoryService = require('../services/categoryService');
const projectService = require('../services/projectService');
const storage = require('../storage/storageManager');

async function list(req, res) {
  const categories = await categoryService.getAll();
  res.json({ categories });
}

async function getOne(req, res) {
  const category = await categoryService.getById(req.params.id);
  if (!category) return res.status(404).json({ error: 'category not found' });
  res.json({ category });
}

async function create(req, res) {
  const result = await categoryService.create(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json({ category: result.category });
}

async function update(req, res) {
  const result = await categoryService.update(req.params.id, req.body);
  if (result.error) {
    const status = result.error === 'category not found' ? 404 : 400;
    return res.status(status).json({ error: result.error });
  }
  // If category name changed, cascade update to projects
  if (result.oldName && result.oldName !== result.category.name) {
    const projects = await projectService.getAll();
    let changed = false;
    for (const p of projects) {
      if (p.category === result.oldName) {
        p.category = result.category.name;
        changed = true;
      }
    }
    if (changed) await storage.writeCollection('projects', projects);
  }
  res.json({ category: result.category });
}

async function remove(req, res) {
  const result = await categoryService.remove(req.params.id);
  if (result.error) return res.status(404).json({ error: result.error });
  res.json({ ok: true });
}

module.exports = { list, getOne, create, update, remove };