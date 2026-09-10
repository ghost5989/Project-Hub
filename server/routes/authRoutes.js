import { authController } from '../controllers/authController.js';

export function authRoutes(req, res, params) {
  const { method, url } = req;
  
  // POST /api/auth/login
  if (method === 'POST' && url === '/api/auth/login') {
    return authController.login(req, res);
  }
  
  // POST /api/auth/logout
  if (method === 'POST' && url === '/api/auth/logout') {
    return authController.logout(req, res);
  }
  
  // GET /api/auth/me
  if (method === 'GET' && url === '/api/auth/me') {
    return authController.me(req, res);
  }
  
  // POST /api/auth/change-password
  if (method === 'POST' && url === '/api/auth/change-password') {
    return authController.changePassword(req, res);
  }
  
  // POST /api/auth/update-email
  if (method === 'POST' && url === '/api/auth/update-email') {
    return authController.updateEmail(req, res);
  }
  
  return null;
}