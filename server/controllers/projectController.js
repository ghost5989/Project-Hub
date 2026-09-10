import projectService from '../services/projectService.js';
import { parseBody } from '../utils/helpers.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const projectController = {
  // GET /api/projects (public)
  list: async (req, res) => {
    const projects = await projectService.getPublicProjects();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      data: projects 
    }));
  },
  
  // GET /api/projects/:id (public)
  get: async (req, res, params) => {
    const { id } = params;
    const project = await projectService.getProjectForPublic(id);
    
    if (!project) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Project not found' 
      }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      data: project 
    }));
  },
  
  // POST /api/projects (admin only)
  create: requireAuth(async (req, res) => {
    const body = await parseBody(req);
    
    try {
      const project = await projectService.createProject(body);
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: project 
      }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: error.message 
      }));
    }
  }),
  
  // PUT /api/projects/:id (admin only)
  update: requireAuth(async (req, res, params) => {
    const { id } = params;
    const body = await parseBody(req);
    
    try {
      const project = await projectService.updateProject(id, body);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: project 
      }));
    } catch (error) {
      const status = error.message === 'Project not found' ? 404 : 400;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: error.message 
      }));
    }
  }),
  
  // DELETE /api/projects/:id (admin only)
  delete: requireAuth(async (req, res, params) => {
    const { id } = params;
    
    try {
      await projectService.deleteProject(id);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Project deleted' 
      }));
    } catch (error) {
      const status = error.message === 'Project not found' ? 404 : 400;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: error.message 
      }));
    }
  }),
  
  // POST /api/projects/reorder (admin only)
  reorder: requireAuth(async (req, res) => {
    const body = await parseBody(req);
    
    if (!body.orderedIds || !Array.isArray(body.orderedIds)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'orderedIds array is required' 
      }));
      return;
    }
    
    try {
      const projects = await projectService.reorderProjects(body.orderedIds);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: projects 
      }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: error.message 
      }));
    }
  }),
  
  // POST /api/projects/:id/verify-github-access (public)
  verifyGithub: rateLimit({ windowMs: 600000, max: 20 })(async (req, res, params) => {
    const { id } = params;
    const body = await parseBody(req);
    
    try {
      const result = await projectService.verifyGithubAccess(id, body.password || '');
      
      if (!result.success) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: result.message,
          isProtected: result.isProtected,
        }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        githubUrl: result.githubUrl,
        isProtected: result.isProtected,
      }));
    } catch (error) {
      const status = error.message === 'Project not found' ? 404 : 400;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: error.message 
      }));
    }
  }),
};