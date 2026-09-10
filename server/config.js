import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Debug: Log the loaded values
console.log('📧 Loaded OWNER_EMAIL:', process.env.OWNER_EMAIL);
console.log('🔒 Loaded OWNER_PASSWORD:', process.env.OWNER_PASSWORD ? '***' : 'NOT SET');

const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'default-secret-change-this',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10),
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  
  owner: {
    email: process.env.OWNER_EMAIL || 'owner@example.com',
    password: process.env.OWNER_PASSWORD || 'change-me',
  },
  
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  paths: {
    public: join(__dirname, '..', 'public'),
    storage: join(__dirname, 'storage', 'data'),
  },
  
  storage: {
    projects: 'projects.json',
    categories: 'categories.json',
    settings: 'settings.json',
    users: 'users.json',
  },
};

export default config;