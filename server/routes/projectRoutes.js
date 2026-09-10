import { projectController } from '../controllers/projectController.js';

export function projectRoutes(req, res, params) {
  const { method, url } = req;
  
  // GET /api/projects
  if (method === 'GET' && url === '/api/projects') {
    return projectController.list(req, res);
  }
  
  // POST /api/projects
  if (method === 'POST' && url === '/api/projects') {
    return projectController.create(req, res);
  }
  
  // POST /api/projects/reorder
  if (method === 'POST' && url === '/api/projects/reorder') {
    return projectController.reorder(req, res);
  }
  
  // GET /api/projects/:id
  if (method === 'GET' && url.startsWith('/api/projects/')) {
    const id = url.split('/')[3];
    return projectController.get(req, res, { id });
  }
  
  // PUT /api/projects/:id
  if (method === 'PUT' && url.startsWith('/api/projects/')) {
    const id = url.split('/')[3];
    return projectController.update(req, res, { id });
  }
  
  // DELETE /api/projects/:id
  if (method === 'DELETE' && url.startsWith('/api/projects/')) {
    const id = url.split('/')[3];
    return projectController.delete(req, res, { id });
  }
  
  // POST /api/projects/:id/verify-github-access
  if (method === 'POST' && url.includes('/verify-github-access')) {
    const id = url.split('/')[3];
    return projectController.verifyGithub(req, res, { id });
  }
  
  return null;
}