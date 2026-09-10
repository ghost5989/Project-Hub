import { categoryController } from '../controllers/categoryController.js';

export function categoryRoutes(req, res, params) {
  const { method, url } = req;
  
  // GET /api/categories
  if (method === 'GET' && url === '/api/categories') {
    return categoryController.list(req, res);
  }
  
  // POST /api/categories
  if (method === 'POST' && url === '/api/categories') {
    return categoryController.create(req, res);
  }
  
  // PUT /api/categories/:oldName
  if (method === 'PUT' && url.startsWith('/api/categories/')) {
    const oldName = decodeURIComponent(url.split('/')[3]);
    return categoryController.rename(req, res, { oldName });
  }
  
  // DELETE /api/categories/:name
  if (method === 'DELETE' && url.startsWith('/api/categories/')) {
    const name = decodeURIComponent(url.split('/')[3]);
    return categoryController.delete(req, res, { name });
  }
  
  return null;
}