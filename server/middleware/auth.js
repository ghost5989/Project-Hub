import crypto from 'crypto';
import { getCookie, clearCookie, setCookie } from '../utils/helpers.js';
import config from '../config.js';

// Simple in-memory session store (for development)
// In production, use Redis or a database
const sessions = new Map();

export function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const session = {
    userId: user.id,
    user: { ...user },
    createdAt: Date.now(),
    expiresAt: Date.now() + config.session.maxAge,
  };
  sessions.set(token, session);
  
  // Clean up expired sessions periodically
  if (sessions.size > 1000) {
    cleanExpiredSessions();
  }
  
  return token;
}

export function getSession(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function destroySession(token) {
  if (token) {
    sessions.delete(token);
  }
}

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

export function authenticate(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  const token = cookies.session;
  if (!token) return null;
  return getSession(token);
}

export function requireAuth(handler) {
  return async (req, res, ...args) => {
    const session = authenticate(req);
    
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Authentication required' 
      }));
      return;
    }
    
    req.session = session;
    return handler(req, res, ...args);
  };
}

export function optionalAuth(handler) {
  return async (req, res, ...args) => {
    const session = authenticate(req);
    if (session) {
      req.session = session;
    }
    return handler(req, res, ...args);
  };
}