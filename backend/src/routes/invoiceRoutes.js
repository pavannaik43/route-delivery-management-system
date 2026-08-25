const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, invoiceController.getAllInvoices);
router.get('/:delivery_id', authenticateToken, invoiceController.getInvoiceByDeliveryId);

module.exports = router;
