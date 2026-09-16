'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, attachSession } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', attachSession, authController.me);
router.post('/profile', requireAuth, authController.updateProfile);

module.exports = router;