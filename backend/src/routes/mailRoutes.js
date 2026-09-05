const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mailController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

// All mail endpoints require authentication and admin authorization
router.use(authenticateToken);
router.use(requireRole('admin'));

router.post('/send-admin', mailController.sendAdminNotification);
router.post('/send-summary', mailController.sendDaySummaryEmail);
router.post('/send-invoice', mailController.sendInvoiceEmail);
router.get('/status', mailController.getMailStatus);

module.exports = router;
