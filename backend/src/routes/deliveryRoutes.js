const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, deliveryController.getDeliveries);
router.get('/:id', authenticateToken, deliveryController.getDeliveryById);
router.post('/', authenticateToken, deliveryController.createDelivery);

module.exports = router;
