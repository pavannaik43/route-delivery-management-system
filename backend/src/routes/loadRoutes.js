const express = require('express');
const router = express.Router();
const loadController = require('../controllers/loadController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { validate, loadSchema } = require('../utils/validators');

// Both admin and delivery staff can view and create daily morning loads
router.get('/', authenticateToken, loadController.getLoads);
router.post('/', authenticateToken, validate(loadSchema), loadController.createLoads);

// Admin can edit existing loads (Business Rule #1)
router.put('/:id', authenticateToken, requireRole('admin'), loadController.updateLoad);

module.exports = router;
