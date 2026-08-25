const { db } = require('../db');
const { generateInvoiceNumber } = require('../services/invoiceGenerator');
const { getStockSummary } = require('../services/stockCalculator');

async function getDeliveries(req, res, next) {
  try {
    const { date, shop_id, route } = req.query;

    let query = `
      SELECT 
        d.id,
        d.invoice_no,
        d.delivery_date,
        d.total_amount,
        d.delivered_by,
        u.username AS delivered_by_username,
        d.shop_id,
        s.shop_name,
        s.owner_name,
        s.phone,
        s.address,
        s.route,
        d.created_at,
        COUNT(di.id) AS total_items,
        SUM(di.quantity) AS total_units
      FROM deliveries d
      JOIN shops s ON s.id = d.shop_id
      LEFT JOIN users u ON u.id = d.delivered_by
      LEFT JOIN delivery_items di ON di.delivery_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND d.delivery_date = ?';
      params.push(date);
    }

    if (shop_id) {
      query += ' AND d.shop_id = ?';
      params.push(shop_id);
    }

    if (route) {
      query += ' AND s.route = ?';
      params.push(route);
    }

    query += ' GROUP BY d.id ORDER BY d.delivery_date DESC, d.id DESC';

    const deliveries = await db.all(query, params);

    res.json({ success: true, count: deliveries.length, deliveries });
  } catch (err) {
    next(err);
  }
}

async function getDeliveryById(req, res, next) {
  try {
    const { id } = req.params;

    const delivery = await db.get(
      `SELECT 
        d.id,
        d.invoice_no,
        d.delivery_date,
        d.total_amount,
        d.delivered_by,
        u.username AS delivered_by_username,
        d.shop_id,
        s.shop_name,
        s.owner_name,
        s.phone,
        s.address,
        s.route,
        d.created_at
       FROM deliveries d
       JOIN shops s ON s.id = d.shop_id
       LEFT JOIN users u ON u.id = d.delivered_by
       WHERE d.id = ?`,
      [id]
    );

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    const items = await db.all(
      `SELECT 
        di.id,
        di.product_id,
        p.name AS product_name,
        p.category,
        p.size,
        p.mrp,
        di.quantity,
        di.unit_price,
        di.subtotal
       FROM delivery_items di
       JOIN products p ON p.id = di.product_id
       WHERE di.delivery_id = ?
       ORDER BY p.name ASC`,
      [id]
    );

    res.json({ success: true, delivery: { ...delivery, items } });
  } catch (err) {
    next(err);
  }
}

async function createDelivery(req, res, next) {
  try {
    const { shopId, shop_id, items, deliveryDate, delivery_date } = req.body;
    const targetShopId = Number(shopId || shop_id);
    const targetDate = deliveryDate || delivery_date || new Date().toISOString().split('T')[0];
    const userId = req.user ? req.user.id : null;

    if (!targetShopId) {
      return res.status(400).json({ success: false, message: 'Valid Shop ID is required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product line item is required.' });
    }

    // Step 1: Verify Shop exists
    const shop = await db.get('SELECT * FROM shops WHERE id = ?', [targetShopId]);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Selected shop does not exist.' });
    }

    // Step 2: Run transactional delivery creation
    const deliveryResult = await db.transaction(async (tx) => {
      // Re-fetch current live vehicle stock for that date inside the transaction
      const currentStock = await getStockSummary(targetDate);
      const stockMap = new Map(currentStock.map(s => [s.productId, s]));

      let grandTotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        const prodId = Number(item.productId || item.product_id);
        const qty = Number(item.quantity);
        const stockInfo = stockMap.get(prodId);

        if (!stockInfo) {
          throw new Error(`Product with ID ${prodId} not found.`);
        }

        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Quantity for "${stockInfo.productName}" must be a positive integer.`);
        }

        // Check against current live remaining stock (Business Rule #2 & #3)
        if (qty > stockInfo.rawRemaining) {
          throw new Error(
            `Insufficient vehicle stock for "${stockInfo.productName}". Available: ${stockInfo.rawRemaining}, Requested: ${qty}. Delivery rejected.`
          );
        }

        // Decrement in-memory stock tracking for potential duplicate items in the same payload
        stockInfo.rawRemaining -= qty;

        const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : stockInfo.retailPrice;
        const subtotal = Math.round(qty * unitPrice * 100) / 100;
        grandTotal += subtotal;

        verifiedItems.push({
          productId: prodId,
          productName: stockInfo.productName,
          category: stockInfo.category,
          size: stockInfo.size,
          mrp: stockInfo.mrp,
          quantity: qty,
          unitPrice,
          subtotal
        });
      }

      grandTotal = Math.round(grandTotal * 100) / 100;

      // Generate next sequential invoice number (Business Rule #4)
      const invoiceNo = await generateInvoiceNumber(targetDate);

      // Insert Delivery Header
      const headerRes = await tx.run(
        `INSERT INTO deliveries (shop_id, invoice_no, delivery_date, total_amount, delivered_by)
         VALUES (?, ?, ?, ?, ?)`,
        [targetShopId, invoiceNo, targetDate, grandTotal, userId]
      );

      const deliveryId = headerRes.lastInsertRowid;

      // Insert Delivery Line Items
      for (const vItem of verifiedItems) {
        await tx.run(
          `INSERT INTO delivery_items (delivery_id, product_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [deliveryId, vItem.productId, vItem.quantity, vItem.unitPrice, vItem.subtotal]
        );
      }

      return {
        deliveryId,
        invoiceNo,
        deliveryDate: targetDate,
        totalAmount: grandTotal,
        shop,
        items: verifiedItems
      };
    });

    // Fetch updated stock after transaction commit
    const updatedStock = await getStockSummary(targetDate);

    res.status(201).json({
      success: true,
      message: `Delivery completed and Invoice ${deliveryResult.invoiceNo} generated successfully!`,
      delivery: deliveryResult,
      updatedStock
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Delivery creation failed'
    });
  }
}

module.exports = {
  getDeliveries,
  getDeliveryById,
  createDelivery
};
