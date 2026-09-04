const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// Login rate limiter - strict
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  },
  handler: (req, res) => {
    logger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      type: 'login',
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API general rate limiter - moderate
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.'
  },
  handler: (req, res) => {
    logger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      type: 'api',
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP. Please try again later.'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// User creation rate limiter - prevent account spam
const createUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 user creations per hour
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many user creation attempts. Please try again later.'
  },
  handler: (req, res) => {
    logger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      type: 'user_creation',
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      success: false,
      message: 'Too many user creation attempts. Please try again later.'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  apiLimiter,
  createUserLimiter
};
