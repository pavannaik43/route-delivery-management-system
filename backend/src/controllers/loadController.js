const { db } = require('../db');
const { getStockSummary } = require('../services/stockCalculator');

async function getLoads(req, res, next) {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const loads = await db.all(
      `SELECT 
        vl.id,
        vl.product_id,
        p.name AS product_name,
        p.category,
        p.size,
        p.retail_price,
        p.image,
        vl.quantity,
        vl.load_date,
        vl.loaded_by,
        u.username AS loaded_by_username,
        vl.created_at
       FROM vehicle_load vl
       JOIN products p ON p.id = vl.product_id
       LEFT JOIN users u ON u.id = vl.loaded_by
       WHERE vl.load_date = ?
       ORDER BY p.category, p.name ASC`,
      [targetDate]
    );

    res.json({ success: true, date: targetDate, count: loads.length, loads });
  } catch (err) {
    next(err);
  }
}

async function createLoads(req, res, next) {
  try {
    const { items, date, load_date, loadDate } = req.body;
    const rawDate = load_date || date || loadDate;
    const targetDate = rawDate instanceof Date 
      ? rawDate.toISOString().split('T')[0] 
      : (typeof rawDate === 'string' ? rawDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide items to load.' });
    }

    // Check for existing loads on that date
    const existingLoads = await db.all('SELECT product_id FROM vehicle_load WHERE load_date = ?', [targetDate]);
    const existingProductIds = new Set(existingLoads.map(l => l.product_id));

    const duplicateProducts = [];
    const validItemsToInsert = [];

    for (const item of items) {
      const prodId = Number(item.productId || item.product_id);
      const qty = Number(item.quantity);

      if (qty <= 0) continue;

      if (existingProductIds.has(prodId)) {
        duplicateProducts.push(prodId);
      } else {
        validItemsToInsert.push({ productId: prodId, quantity: qty });
      }
    }

    if (duplicateProducts.length > 0) {
      const prodNames = await db.all(
        `SELECT name FROM products WHERE id IN (${duplicateProducts.join(',')})`
      );
      const namesList = prodNames.map(p => p.name).join(', ');
      return res.status(400).json({
        success: false,
        message: `Business Rule #1 Violation: The following product(s) have already been loaded for date ${targetDate}: [${namesList}]. Products can only be loaded once per day. An admin can edit the existing load quantities.`
      });
    }

    if (validItemsToInsert.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid items with positive quantity provided.' });
    }

    // Insert all items
    for (const item of validItemsToInsert) {
      await db.run(
        `INSERT INTO vehicle_load (product_id, quantity, load_date, loaded_by)
         VALUES (?, ?, ?, ?)`,
        [item.productId, item.quantity, targetDate, userId]
      );
    }

    const updatedStock = await getStockSummary(targetDate);

    res.status(201).json({
      success: true,
      message: `Successfully loaded ${validItemsToInsert.length} product(s) for ${targetDate}.`,
      date: targetDate,
      stock: updatedStock
    });
  } catch (err) {
    next(err);
  }
}

async function updateLoad(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const existing = await db.get('SELECT * FROM vehicle_load WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vehicle load record not found.' });
    }

    const newQty = Number(quantity);
    if (isNaN(newQty) || newQty < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative quantity is required.' });
    }

    // Check delivered quantity for this product on this date
    const deliveredRes = await db.get(
      `SELECT COALESCE(SUM(di.quantity), 0) AS delivered
       FROM delivery_items di
       JOIN deliveries d ON d.id = di.delivery_id
       WHERE di.product_id = ? AND d.delivery_date = ?`,
      [existing.product_id, existing.load_date]
    );

    const alreadyDelivered = Number(deliveredRes.delivered);
    if (newQty < alreadyDelivered) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce loaded quantity to ${newQty} because ${alreadyDelivered} units have already been delivered today! Remaining stock cannot be negative.`
      });
    }

    await db.run('UPDATE vehicle_load SET quantity = ? WHERE id = ?', [newQty, id]);

    const updated = await db.get(
      `SELECT vl.*, p.name AS product_name 
       FROM vehicle_load vl 
       JOIN products p ON p.id = vl.product_id 
       WHERE vl.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Vehicle load updated successfully',
      load: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLoads,
  createLoads,
  updateLoad
};
