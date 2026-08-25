const bcrypt = require('bcryptjs');
const { db } = require('../db');

async function getUsers(req, res, next) {
  try {
    const users = await db.all(
      'SELECT id, username, role, created_at FROM users ORDER BY role ASC, username ASC'
    );
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Username, password, and role are required.' });
    }

    if (!['admin', 'delivery_staff'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be either "admin" or "delivery_staff".' });
    }

    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username.trim(), hashedPassword, role]
    );

    const newUser = await db.get('SELECT id, username, role, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, message: 'User created successfully', user: newUser });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { role, password } = req.body;

    const existing = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role && !['admin', 'delivery_staff'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be "admin" or "delivery_staff".' });
    }

    const newRole = role || existing.role;

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password.trim(), salt);
      await db.run('UPDATE users SET role = ?, password = ? WHERE id = ?', [newRole, hashedPassword, id]);
    } else {
      await db.run('UPDATE users SET role = ? WHERE id = ?', [newRole, id]);
    }

    const updated = await db.get('SELECT id, username, role, created_at FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User updated successfully', user: updated });
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
