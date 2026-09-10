import config from '../config.js';
import projectService from '../services/projectService.js';
import categoryService from '../services/categoryService.js';
import settingsService from '../services/settingsService.js';

export const healthController = {
  // GET /api/health
  health: async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      environment: config.server.env,
      timestamp: new Date().toISOString(),
    }));
  },
  
  // GET /api/public-data - Combined endpoint for faster loading
  publicData: async (req, res) => {
    try {
      const [settings, projects, categories] = await Promise.all([
        settingsService.getSettings(),
        projectService.getPublicProjects(),
        categoryService.getCategories(),
      ]);
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minute cache
      });
      res.end(JSON.stringify({
        success: true,
        data: { settings, projects, categories }
      }));
    } catch (error) {
      console.error('Public data error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: error.message || 'Failed to load public data'
      }));
    }
  },
};