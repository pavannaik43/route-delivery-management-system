const bcrypt = require('bcryptjs');
const { db } = require('../db');
const logger = require('../config/logger');

async function getUsers(req, res, next) {
  try {
    const users = await db.all(
      'SELECT id, username, email, phone, role, created_at FROM users ORDER BY role ASC, username ASC'
    );
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { username, email, password, phone, role } = req.body;

    if (!username || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, phone, and role are required.'
      });
    }

    if (!['admin', 'delivery_staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "admin" or "delivery_staff".'
      });
    }

    // Check if username already exists
    const existingUsername = await db.get('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existingUsername) {
      logger.logSecurityEvent('USER_CREATION_FAILED', {
        reason: 'username_exists',
        attemptedUsername: username.trim(),
        ip: req.ip,
        adminId: req.user?.id
      });
      return res.status(400).json({
        success: false,
        message: 'Username already exists. Please choose a different username.'
      });
    }

    // Check if email already exists
    const existingEmail = await db.get('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existingEmail) {
      logger.logSecurityEvent('USER_CREATION_FAILED', {
        reason: 'email_exists',
        attemptedEmail: email.trim(),
        ip: req.ip,
        adminId: req.user?.id
      });
      return res.status(400).json({
        success: false,
        message: 'Email already exists. Please use a different email address.'
      });
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create driver account
    const result = await db.run(
      'INSERT INTO users (username, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), email.trim(), hashedPassword, phone.trim(), role]
    );

    // Return user data without password
    const newUser = await db.get(
      'SELECT id, username, email, phone, role, created_at FROM users WHERE id = ?',
      [result.lastInsertRowid]
    );

    logger.info('User created successfully', {
      newUserId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: `${role === 'delivery_staff' ? 'Driver' : 'User'} created successfully`,
      user: newUser
    });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { email, phone, role } = req.body;

    const existing = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role && !['admin', 'delivery_staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be "admin" or "delivery_staff".'
      });
    }

    // Check if new email already exists (if email is being changed)
    if (email && email.trim() !== existing.email) {
      const existingEmail = await db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email.trim(), id]
      );
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists. Please use a different email address.'
        });
      }
    }

    // Build update query dynamically based on what fields are provided
    const updates = [];
    const params = [];

    if (email) {
      updates.push('email = ?');
      params.push(email.trim());
    }
    if (phone) {
      updates.push('phone = ?');
      params.push(phone.trim());
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);
    await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updated = await db.get(
      'SELECT id, username, email, phone, role, created_at FROM users WHERE id = ?',
      [id]
    );

    logger.info('User updated successfully', {
      userId: id,
      updatedBy: req.user?.id,
      fieldsUpdated: updates
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own active user account.' });
    }

    const existing = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
