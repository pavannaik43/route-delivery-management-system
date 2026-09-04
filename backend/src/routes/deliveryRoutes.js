const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authenticateToken } = require('../middleware/auth');
const { validate, validateQuery, createDeliverySchema, dateQuerySchema } = require('../utils/validators');

router.get('/', authenticateToken, validateQuery(dateQuerySchema), deliveryController.getDeliveries);
router.get('/:id', authenticateToken, deliveryController.getDeliveryById);
router.post('/', authenticateToken, validate(createDeliverySchema), deliveryController.createDelivery);

module.exports = router;
