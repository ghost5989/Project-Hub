import settingsService from '../services/settingsService.js';
import { parseBody } from '../utils/helpers.js';
import { requireAuth } from '../middleware/auth.js';

export const settingsController = {
  // GET /api/settings
  get: async (req, res) => {
    const settings = await settingsService.getSettings();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      data: settings 
    }));
  },
  
  // PUT /api/settings (admin only)
  update: requireAuth(async (req, res) => {
    const body = await parseBody(req);
    
    try {
      const settings = await settingsService.saveSettings(body);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: settings 
      }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: error.message 
      }));
    }
  }),
};