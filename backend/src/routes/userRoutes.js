const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

// All user management routes are strictly Admin-only
router.get('/', authenticateToken, requireRole('admin'), userController.getUsers);
router.post('/', authenticateToken, requireRole('admin'), userController.createUser);
router.put('/:id', authenticateToken, requireRole('admin'), userController.updateUser);
router.delete('/:id', authenticateToken, requireRole('admin'), userController.deleteUser);

module.exports = router;
