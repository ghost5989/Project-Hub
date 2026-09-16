'use strict';

const projectService = require('./projectService');
const settingsService = require('./settingsService');
const config = require('../config');

/**
 * Verify a GitHub access request. Server-side only.
 * Priority for the expected password:
 *   1. Per-project password (if the request carries a projectId and that project has one)
 *   2. settings.githubPassword  (DB-stored, set via owner Settings tab)
 *   3. config.github.fallbackPassword  (GITHUB_ACCESS_PASSWORD env var)
 *
 * NEVER returns the password to the caller.
 * Returns { ok: true, url } on success, or { ok: false, error } on failure.
 */
async function verifyAccess(params) {
  const projectId = params && params.projectId ? params.projectId : null;
  const enteredPassword = params ? params.enteredPassword : '';

  if (typeof enteredPassword !== 'string') {
    return { ok: false, error: 'password required' };
  }

  let targetUrl = null;
  let expected = null;

  if (projectId) {
    const project = await projectService.getById(projectId);
    if (!project) return { ok: false, error: 'project not found' };
    targetUrl = project.githubUrl || null;
    if (project.githubPassword && project.githubPassword.trim()) {
      expected = project.githubPassword;
    }
  } else {
    const settings = await settingsService.getSettings();
    targetUrl = settings.githubUrl || null;
    if (settings.githubPassword && settings.githubPassword.trim()) {
      expected = settings.githubPassword;
    }
  }

  // Environment variable fallback
  if (!expected && config.github.fallbackPassword) {
    expected = config.github.fallbackPassword;
  }

  // No password configured anywhere → public access
  if (!expected) {
    return { ok: true, url: targetUrl };
  }

  if (enteredPassword !== expected) {
    return { ok: false, error: 'invalid password' };
  }

  return { ok: true, url: targetUrl };
}

module.exports = { verifyAccess: verifyAccess };