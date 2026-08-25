const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

// Read allowed for all authenticated users (delivery_staff needs to pick shops)
router.get('/', authenticateToken, shopController.getShops);
router.get('/:id', authenticateToken, shopController.getShopById);

// Writes restricted to Admin
router.post('/', authenticateToken, requireRole('admin'), shopController.createShop);
router.put('/:id', authenticateToken, requireRole('admin'), shopController.updateShop);
router.delete('/:id', authenticateToken, requireRole('admin'), shopController.deleteShop);

module.exports = router;
