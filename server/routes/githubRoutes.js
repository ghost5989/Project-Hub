'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/githubController');
const { githubLimiter } = require('../middleware/rateLimit');

router.post('/verify', githubLimiter, controller.verify);

module.exports = router;