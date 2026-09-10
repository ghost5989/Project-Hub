import { healthController } from '../controllers/healthController.js';

export function healthRoutes(req, res, params) {
  const { method, url } = req;
  
  // GET /api/health
  if (method === 'GET' && url === '/api/health') {
    return healthController.health(req, res);
  }
  
  // GET /api/public-data - Combined endpoint
  if (method === 'GET' && url === '/api/public-data') {
    return healthController.publicData(req, res);
  }
  
  return null;
}