'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/projectController');
const { requireAuth } = require('../middleware/auth');

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requireAuth, controller.create);
router.put('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

module.exports = router;