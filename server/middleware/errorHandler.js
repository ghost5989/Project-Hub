export function errorHandler(handler) {
  return async (req, res, ...args) => {
    try {
      return await handler(req, res, ...args);
    } catch (error) {
      console.error('Error:', error);
      
      const status = error.status || 500;
      const message = status === 500 ? 'Internal server error' : error.message;
      
      if (!res.headersSent) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        }));
      }
    }
  };
}