'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/contactController');
const { contactLimiter } = require('../middleware/rateLimit');

router.post('/', contactLimiter, controller.submit);

module.exports = router;