const { db } = require('../db');

async function getShops(req, res, next) {
  try {
    const { route, search } = req.query;

    let query = 'SELECT * FROM shops WHERE 1=1';
    const params = [];

    if (route) {
      query += ' AND route = ?';
      params.push(route);
    }

    if (search) {
      query += ' AND (shop_name LIKE ? OR owner_name LIKE ? OR route LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY route, shop_name ASC';

    const shops = await db.all(query, params);

    // Also get list of distinct routes
    const routesRes = await db.all('SELECT DISTINCT route FROM shops WHERE route IS NOT NULL ORDER BY route ASC');
    const routes = routesRes.map(r => r.route);

    res.json({ success: true, count: shops.length, routes, shops });
  } catch (err) {
    next(err);
  }
}

async function getShopById(req, res, next) {
  try {
    const { id } = req.params;
    const shop = await db.get('SELECT * FROM shops WHERE id = ?', [id]);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Fetch past deliveries for this shop
    const deliveries = await db.all(
      `SELECT d.id, d.invoice_no, d.delivery_date, d.total_amount, u.username as delivered_by_user
       FROM deliveries d
       LEFT JOIN users u ON u.id = d.delivered_by
       WHERE d.shop_id = ?
       ORDER BY d.delivery_date DESC, d.id DESC LIMIT 10`,
      [id]
    );

    res.json({ success: true, shop: { ...shop, deliveries } });
  } catch (err) {
    next(err);
  }
}

async function createShop(req, res, next) {
  try {
    const { shop_name, owner_name, phone, address, route } = req.body;

    if (!shop_name) {
      return res.status(400).json({ success: false, message: 'Shop name is required.' });
    }

    const result = await db.run(
      `INSERT INTO shops (shop_name, owner_name, phone, address, route)
       VALUES (?, ?, ?, ?, ?)`,
      [
        shop_name.trim(),
        owner_name ? owner_name.trim() : '',
        phone ? phone.trim() : '',
        address ? address.trim() : '',
        route ? route.trim() : 'General Route'
      ]
    );

    const newShop = await db.get('SELECT * FROM shops WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, message: 'Shop created successfully', shop: newShop });
  } catch (err) {
    next(err);
  }
}

async function updateShop(req, res, next) {
  try {
    const { id } = req.params;
    const { shop_name, owner_name, phone, address, route } = req.body;

    const existing = await db.get('SELECT * FROM shops WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    await db.run(
      `UPDATE shops 
       SET shop_name = ?, owner_name = ?, phone = ?, address = ?, route = ?
       WHERE id = ?`,
      [
        shop_name !== undefined ? shop_name.trim() : existing.shop_name,
        owner_name !== undefined ? owner_name.trim() : existing.owner_name,
        phone !== undefined ? phone.trim() : existing.phone,
        address !== undefined ? address.trim() : existing.address,
        route !== undefined ? route.trim() : existing.route,
        id
      ]
    );

    const updated = await db.get('SELECT * FROM shops WHERE id = ?', [id]);
    res.json({ success: true, message: 'Shop updated successfully', shop: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteShop(req, res, next) {
  try {
    const { id } = req.params;

    const deliveryRef = await db.get('SELECT COUNT(*) as count FROM deliveries WHERE shop_id = ?', [id]);
    if (deliveryRef.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete shop with existing delivery records.'
      });
    }

    await db.run('DELETE FROM shops WHERE id = ?', [id]);
    res.json({ success: true, message: 'Shop deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop
};
