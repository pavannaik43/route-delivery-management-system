const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');
const logger = require('../config/logger');

async function login(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.'
      });
    }

    // Verify that username, email, and password all belong to the same account
    const user = await db.get(
      'SELECT * FROM users WHERE username = ? AND email = ?',
      [username.trim(), email.trim()]
    );

    if (!user) {
      logger.logSecurityEvent('LOGIN_FAILED', {
        username: username.trim(),
        email: email.trim(),
        ip: req.ip,
        reason: 'credentials_mismatch'
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Username, email, and password must all match.'
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      logger.logSecurityEvent('LOGIN_FAILED', {
        username: username.trim(),
        email: email.trim(),
        ip: req.ip,
        reason: 'invalid_password'
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Username, email, and password must all match.'
      });
    }

    logger.info('Login successful', {
      username: username.trim(),
      email: email.trim(),
      userId: user.id,
      role: user.role
    });

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await db.get(
      'SELECT id, username, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current user
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      logger.logSecurityEvent('PASSWORD_CHANGE_FAILED', {
        userId: userId,
        username: user.username,
        ip: req.ip,
        reason: 'invalid_current_password'
      });
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password (username and email remain unchanged)
    await db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    logger.info('Password changed successfully', {
      userId: userId,
      username: user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully' });
}

module.exports = {
  login,
  me,
  logout,
  changePassword
};
