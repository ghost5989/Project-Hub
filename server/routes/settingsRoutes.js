'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/settingsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', controller.get);
router.put('/', requireAuth, controller.update);

module.exports = router;