import http from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { gzip } from 'zlib';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import config from './config.js';
import authService from './services/authService.js';
import { cors } from './middleware/cors.js';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import { authRoutes } from './routes/authRoutes.js';
import { projectRoutes } from './routes/projectRoutes.js';
import { categoryRoutes } from './routes/categoryRoutes.js';
import { settingsRoutes } from './routes/settingsRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize owner account
try {
  await authService.initializeOwner();
} catch (error) {
  console.error('Failed to initialize owner:', error);
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.wasm': 'application/wasm',
};

// Cache headers by file type
const CACHE_CONTROL = {
  '.html': 'public, max-age=0, must-revalidate',
  '.css': 'public, max-age=86400, immutable', // 1 day
  '.js': 'public, max-age=86400, immutable', // 1 day
  '.mjs': 'public, max-age=86400, immutable',
  '.json': 'public, max-age=86400, immutable',
  '.png': 'public, max-age=604800, immutable', // 7 days
  '.jpg': 'public, max-age=604800, immutable',
  '.jpeg': 'public, max-age=604800, immutable',
  '.gif': 'public, max-age=604800, immutable',
  '.svg': 'public, max-age=604800, immutable',
  '.ico': 'public, max-age=604800, immutable',
  '.txt': 'public, max-age=3600',
  '.wasm': 'public, max-age=604800, immutable',
};

function serveStatic(req, res) {
  let path = req.url;
  
  // Serve index.html for root
  if (path === '/' || path === '') {
    path = '/index.html';
  }
  
  // Don't serve API routes as static
  if (path.startsWith('/api/')) {
    return false;
  }
  
  // Get file path
  const filePath = join(config.paths.public, path);
  
  // Check if file exists
  if (!existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }
  
  // Check if it's a directory
  try {
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      const indexPath = join(filePath, 'index.html');
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
        return true;
      }
      return false;
    }
  } catch (e) {
    return false;
  }
  
  // Read and serve file with compression
  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    const cacheControl = CACHE_CONTROL[ext] || 'public, max-age=3600';
    
    // Check if client accepts gzip
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const canGzip = acceptEncoding.includes('gzip') && 
                   (ext === '.html' || ext === '.css' || ext === '.js' || 
                    ext === '.mjs' || ext === '.json' || ext === '.txt' || ext === '.svg');
    
    const headers = { 
      'Content-Type': mimeType,
      'Cache-Control': cacheControl,
    };
    
    if (canGzip) {
      // Compress and serve using gzip from zlib
      gzip(content, (err, compressed) => {
        if (err) {
          // Fallback to uncompressed
          console.warn('⚠️ Gzip compression failed, serving uncompressed:', err.message);
          res.writeHead(200, headers);
          res.end(content);
          return;
        }
        headers['Content-Encoding'] = 'gzip';
        headers['Content-Length'] = compressed.length;
        res.writeHead(200, headers);
        res.end(compressed);
      });
      return true;
    } else {
      res.writeHead(200, headers);
      res.end(content);
      return true;
    }
  } catch (error) {
    console.error(`Error serving ${filePath}:`, error);
    return false;
  }
}

// Route handler
function handleRequest(req, res) {
  const url = req.url || '/';
  const method = req.method || 'GET';
  
  console.log(`📡 ${method} ${url}`);
  
  // Serve static files
  if (serveStatic(req, res)) {
    return;
  }
  
  // API routes
  if (url.startsWith('/api/')) {
    let handler = null;
    
    handler = authRoutes(req, res);
    if (handler) return;
    
    handler = projectRoutes(req, res);
    if (handler) return;
    
    handler = categoryRoutes(req, res);
    if (handler) return;
    
    handler = settingsRoutes(req, res);
    if (handler) return;
    
    handler = healthRoutes(req, res);
    if (handler) return;
    
    // API route not found
    console.log(`❌ API not found: ${url}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      message: 'API endpoint not found' 
    }));
    return;
  }
  
  // SPA fallback - serve index.html for client-side routing
  if (!url.includes('.') && url !== '/') {
    try {
      const indexPath = join(config.paths.public, 'index.html');
      const content = readFileSync(indexPath);
      console.log(`✅ SPA fallback: ${url} -> index.html`);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    } catch {
      // Fall through to 404
    }
  }
  
  // 404
  console.log(`❌ 404: ${url}`);
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('<h1>404 - Not Found</h1>');
}

// Create server with middleware
const wrappedHandler = errorHandler(cors(logger(handleRequest)));

const server = http.createServer((req, res) => {
  wrappedHandler(req, res);
});

// Use environment variables for Render
const port = process.env.PORT || config.server.port || 3000;
const host = process.env.HOST || '0.0.0.0';

server.listen(port, host, () => {
  console.log(`🚀 Project Hub Server running on port ${port}`);
  console.log(`📁 Environment: ${config.server.env}`);
  console.log(`🔒 Owner: ${config.owner.email}`);
  console.log(`📊 API endpoints available at /api/`);
  console.log(`📂 Public directory: ${config.paths.public}`);
  console.log(`💡 Visit: http://localhost:${port}/login.html`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});