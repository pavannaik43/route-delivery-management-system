const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validate, loginSchema, changePasswordSchema } = require('../utils/validators');

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.me);
router.post('/change-password', authenticateToken, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
