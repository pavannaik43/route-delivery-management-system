const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, stockController.getStock);

module.exports = router;
