const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

router.get('/today', authenticateToken, requireRole('admin'), dashboardController.getTodayDashboard);

module.exports = router;
