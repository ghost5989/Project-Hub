import categoryService from '../services/categoryService.js';
import { parseBody } from '../utils/helpers.js';
import { requireAuth } from '../middleware/auth.js';

export const categoryController = {
  // GET /api/categories
  list: async (req, res) => {
    const categories = await categoryService.getCategories();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      data: categories 
    }));
  },
  
  // POST /api/categories (admin only)
  create: requireAuth(async (req, res) => {
    const body = await parseBody(req);
    
    if (!body.name || !body.name.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Category name is required' 
      }));
      return;
    }
    
    try {
      const categories = await categoryService.addCategory(body.name);
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: categories 
      }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: error.message 
      }));
    }
  }),
  
  // PUT /api/categories/:oldName (admin only)
  rename: requireAuth(async (req, res, params) => {
    const { oldName } = params;
    const body = await parseBody(req);
    
    if (!body.name || !body.name.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Category name is required' 
      }));
      return;
    }
    
    try {
      const categories = await categoryService.renameCategory(oldName, body.name);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: categories 
      }));
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: error.message 
      }));
    }
  }),
  
  // DELETE /api/categories/:name (admin only)
  delete: requireAuth(async (req, res, params) => {
    const { name } = params;
    
    try {
      const categories = await categoryService.deleteCategory(name);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: categories 
      }));
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: error.message 
      }));
    }
  }),
};