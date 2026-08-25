const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');
const { authenticateToken } = require('../middleware/auth');

router.get('/day', authenticateToken, summaryController.getDaySummary);

module.exports = router;
