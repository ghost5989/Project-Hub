import authService from '../services/authService.js';
import { validateLogin } from '../utils/validators.js';
import { parseBody, setCookie } from '../utils/helpers.js';
import { createSession, destroySession, requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const authController = {
  // POST /api/auth/login
  login: rateLimit({ windowMs: 900000, max: 10 })(async (req, res) => {
    const body = await parseBody(req);
    console.log('🔐 Login request for:', body.email);
    
    // Validate input
    const validation = validateLogin(body.email, body.password);
    if (!validation.valid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: validation.errors.join(', ') 
      }));
      return;
    }
    
    // Authenticate
    const user = await authService.authenticateUser(body.email, body.password);
    if (!user) {
      console.log('❌ Login failed for:', body.email);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Invalid email or password' 
      }));
      return;
    }
    
    console.log('✅ Login successful for:', user.email);
    
    // Create session
    const token = createSession(user);
    console.log('🔑 Session token created:', token.substring(0, 20) + '...');
    
    // Set cookie with proper settings
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 86400000,
      path: '/',
      secure: false, // Set to true if using HTTPS
    };
    
    setCookie(res, 'session', token, cookieOptions);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      data: { user } 
    }));
  }),
  
  // POST /api/auth/logout
  logout: async (req, res) => {
    const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
      const [key, value] = c.trim().split('=');
      acc[key] = value;
      return acc;
    }, {}) || {};
    
    const token = cookies.session;
    if (token) {
      destroySession(token);
      console.log('🔓 Session destroyed');
    }
    
    setCookie(res, 'session', '', { maxAge: 0, path: '/' });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  },
  
  // GET /api/auth/me
  me: async (req, res) => {
    const session = req.session;
    
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Not authenticated' 
      }));
      return;
    }
    
    const { password: _, ...user } = session.user;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      data: user 
    }));
  },

  // POST /api/auth/change-password
  changePassword: requireAuth(async (req, res) => {
    const body = await parseBody(req);
    const { currentPassword, newPassword } = body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Current password and new password are required' 
      }));
      return;
    }
    
    if (newPassword.length < 6) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      }));
      return;
    }
    
    // Get user from database
    const user = await authService.findUserByEmail(req.session.user.email);
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'User not found' 
      }));
      return;
    }
    
    // Verify current password
    const isValid = await authService.verifyPassword(currentPassword, user.password);
    if (!isValid) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Current password is incorrect' 
      }));
      return;
    }
    
    // Update password
    try {
      await authService.updatePassword(req.session.user.email, newPassword);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Password updated successfully' 
      }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: error.message 
      }));
    }
  }),

  // POST /api/auth/update-email
  updateEmail: requireAuth(async (req, res) => {
    const body = await parseBody(req);
    const { newEmail, password } = body;
    
    // Validate input
    if (!newEmail || !newEmail.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'New email is required' 
      }));
      return;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Invalid email format' 
      }));
      return;
    }
    
    // Verify password
    if (!password) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Password is required to verify identity' 
      }));
      return;
    }
    
    // Get user from database
    const user = await authService.findUserByEmail(req.session.user.email);
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'User not found' 
      }));
      return;
    }
    
    // Verify password
    const isValid = await authService.verifyPassword(password, user.password);
    if (!isValid) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Incorrect password' 
      }));
      return;
    }
    
    // Update email
    try {
      const updatedUser = await authService.updateEmail(req.session.user.email, newEmail);
      
      // Update session
      req.session.user = updatedUser;
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: updatedUser,
        message: 'Email updated successfully' 
      }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: error.message 
      }));
    }
  })
};