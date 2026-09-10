import config from '../config.js';

export function cors(handler) {
  return async (req, res, ...args) => {
    const origin = req.headers.origin;
    
    // Get allowed origins from environment or use defaults
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    
    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'https://project-hub.onrender.com',
      'https://*.onrender.com',
      corsOrigin,
    ];
    
    // Check if origin is allowed, or use a default
    let allowedOrigin = corsOrigin;
    if (origin) {
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed.includes('*')) {
          const pattern = allowed.replace('*', '.*');
          return new RegExp(pattern).test(origin);
        }
        return allowed === origin;
      });
      if (isAllowed) {
        allowedOrigin = origin;
      }
    }
    
    // Only set CORS headers if we have a valid origin
    try {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
      res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
    } catch (error) {
      console.error('CORS header error:', error);
    }
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    return handler(req, res, ...args);
  };
}