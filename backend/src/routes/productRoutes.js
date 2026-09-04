const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { validate, productSchema } = require('../utils/validators');

// Read is allowed for all authenticated users (both admin & delivery_staff need to view product list)
router.get('/', authenticateToken, productController.getProducts);
router.get('/:id', authenticateToken, productController.getProductById);

// Writes are restricted to Admin
router.post('/', authenticateToken, requireRole('admin'), validate(productSchema), productController.createProduct);
router.put('/:id', authenticateToken, requireRole('admin'), validate(productSchema), productController.updateProduct);
router.delete('/:id', authenticateToken, requireRole('admin'), productController.deleteProduct);

module.exports = router;
