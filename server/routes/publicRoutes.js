'use strict';

const express = require('express');
const router = express.Router();
const settingsService = require('../services/settingsService');
const projectService = require('../services/projectService');
const categoryService = require('../services/categoryService');

router.get('/', async (req, res, next) => {
  try {
    const [settings, projects, categories] = await Promise.all([
      settingsService.getPublicSettings(),
      projectService.getPublished(),
      categoryService.getAll()
    ]);

    const publicProjects = projects
      .map(projectService.toPublic)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      settings,
      projects: publicProjects,
      categories
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;