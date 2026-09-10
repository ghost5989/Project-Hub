const requests = new Map();

export function rateLimit(options = {}) {
  const {
    windowMs = 900000, // 15 minutes
    max = 100,
    message = 'Too many requests, please try again later.',
  } = options;
  
  return function(handler) {
    return async (req, res, ...args) => {
      const ip = req.socket?.remoteAddress || 'unknown';
      const key = `${ip}:${req.url}`;
      const now = Date.now();
      
      const record = requests.get(key) || { count: 0, resetAt: now + windowMs };
      
      // Reset if window expired
      if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + windowMs;
      }
      
      record.count++;
      requests.set(key, record);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
      res.setHeader('X-RateLimit-Reset', record.resetAt);
      
      if (record.count > max) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message,
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        }));
        return;
      }
      
      return handler(req, res, ...args);
    };
  };
}

// Clean up old records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requests) {
    if (now > record.resetAt) {
      requests.delete(key);
    }
  }
}, 60000);