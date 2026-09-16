'use strict';

const projectService = require('../services/projectService');
const categoryService = require('../services/categoryService');

async function list(req, res) {
  const projects = await projectService.getAll();
  res.json({ projects });
}

async function getOne(req, res) {
  const project = await projectService.getById(req.params.id);
  if (!project) return res.status(404).json({ error: 'project not found' });
  res.json({ project });
}

async function create(req, res) {
  const categories = await categoryService.getAll();
  const result = await projectService.create(req.body, categories);
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json({ project: result.project });
}

async function update(req, res) {
  const categories = await categoryService.getAll();
  const result = await projectService.update(req.params.id, req.body, categories);
  if (result.error) {
    const status = result.error === 'project not found' ? 404 : 400;
    return res.status(status).json({ error: result.error });
  }
  res.json({ project: result.project });
}

async function remove(req, res) {
  const result = await projectService.remove(req.params.id);
  if (result.error) return res.status(404).json({ error: result.error });
  res.json({ ok: true });
}

module.exports = { list, getOne, create, update, remove };