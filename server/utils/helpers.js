export function parseJSONSafely(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function getIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  return cookies[name] || null;
}

export function setCookie(res, name, value, options = {}) {
  const defaultOptions = {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 86400000,
    path: '/',
  };
  
  const merged = { ...defaultOptions, ...options };
  const parts = [`${name}=${value}`];
  
  if (merged.httpOnly) parts.push('HttpOnly');
  if (merged.secure) parts.push('Secure');
  if (merged.sameSite) parts.push(`SameSite=${merged.sameSite}`);
  if (merged.maxAge !== undefined) parts.push(`Max-Age=${merged.maxAge}`);
  if (merged.path) parts.push(`Path=${merged.path}`);
  if (merged.domain) parts.push(`Domain=${merged.domain}`);
  
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearCookie(res, name) {
  setCookie(res, name, '', { maxAge: 0 });
}

export function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : null);
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}