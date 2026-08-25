const { db } = require('../db');

async function getInvoiceByDeliveryId(req, res, next) {
  try {
    const { delivery_id } = req.params;

    const delivery = await db.get(
      `SELECT 
        d.id AS delivery_id,
        d.invoice_no,
        d.delivery_date,
        d.total_amount,
        d.delivered_by,
        u.username AS delivered_by_username,
        s.id AS shop_id,
        s.shop_name,
        s.owner_name,
        s.phone AS shop_phone,
        s.address AS shop_address,
        s.route AS shop_route,
        d.created_at
       FROM deliveries d
       JOIN shops s ON s.id = d.shop_id
       LEFT JOIN users u ON u.id = d.delivered_by
       WHERE d.id = ?`,
      [delivery_id]
    );

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Invoice not found for this delivery ID.' });
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
      [delivery_id]
    );

    const companyInfo = {
      name: 'Hatsun Agro Product Ltd.',
      subtitle: 'Route Delivery Management System (RDMS)',
      address: 'Plot No. 14, TNHB Complex, Chennai - 600040, Tamil Nadu',
      gstin: '33AAACH1234F1Z5',
      fssai: '10012042000123',
      phone: '1800-425-4287',
      email: 'support@hap.dairy.in'
    };

    res.json({
      success: true,
      invoice: {
        ...delivery,
        items,
        companyInfo
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getAllInvoices(req, res, next) {
  try {
    const { date, search, shop_id } = req.query;

    let query = `
      SELECT 
        d.id AS delivery_id,
        d.invoice_no,
        d.delivery_date,
        d.total_amount,
        d.delivered_by,
        u.username AS delivered_by_username,
        s.id AS shop_id,
        s.shop_name,
        s.owner_name,
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

    if (search) {
      query += ' AND (d.invoice_no LIKE ? OR s.shop_name LIKE ? OR s.owner_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY d.id ORDER BY d.delivery_date DESC, d.id DESC';

    const invoices = await db.all(query, params);

    res.json({ success: true, count: invoices.length, invoices });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInvoiceByDeliveryId,
  getAllInvoices
};
