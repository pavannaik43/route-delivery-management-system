const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

// Analytics reports are restricted to Admin
router.get('/daily', authenticateToken, requireRole('admin'), reportController.getDailyReport);
router.get('/monthly', authenticateToken, requireRole('admin'), reportController.getMonthlyReport);
router.get('/products', authenticateToken, requireRole('admin'), reportController.getProductReport);
router.get('/shops', authenticateToken, requireRole('admin'), reportController.getShopReport);

module.exports = router;
