export function logger(handler) {
  return async (req, res, ...args) => {
    const start = Date.now();
    const { method, url } = req;
    const ip = req.socket?.remoteAddress || 'unknown';
    
    // Log request
    console.log(`[${new Date().toISOString()}] ${method} ${url} from ${ip}`);
    
    // Track if headers have been sent
    let headersSent = false;
    
    // Capture response
    const originalEnd = res.end;
    let statusCode = 200;
    
    res.end = function(...args) {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${method} ${url} → ${statusCode} (${duration}ms)`);
      originalEnd.apply(this, args);
    };
    
    // Monkey-patch writeHead to capture status code
    const originalWriteHead = res.writeHead;
    res.writeHead = function(status, ...args) {
      statusCode = status;
      headersSent = true;
      return originalWriteHead.apply(this, [status, ...args]);
    };
    
    // Also track if headers are sent via setHeader
    const originalSetHeader = res.setHeader;
    res.setHeader = function(name, value) {
      if (value === undefined) {
        console.warn(`⚠️ Attempted to set header "${name}" with undefined value`);
        return;
      }
      return originalSetHeader.call(this, name, value);
    };
    
    return handler(req, res, ...args);
  };
}