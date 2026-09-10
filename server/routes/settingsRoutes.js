import { settingsController } from '../controllers/settingsController.js';

export function settingsRoutes(req, res, params) {
  const { method, url } = req;
  
  // GET /api/settings
  if (method === 'GET' && url === '/api/settings') {
    return settingsController.get(req, res);
  }
  
  // PUT /api/settings
  if (method === 'PUT' && url === '/api/settings') {
    return settingsController.update(req, res);
  }
  
  return null;
}