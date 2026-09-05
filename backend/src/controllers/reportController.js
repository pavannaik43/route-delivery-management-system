const { db } = require('../db');

async function getDailyReport(req, res, next) {
  try {
    const { from, to, date } = req.query;

    let query = `
      SELECT 
        d.delivery_date AS date,
        COUNT(DISTINCT d.id) AS deliveries_count,
        COUNT(DISTINCT d.shop_id) AS unique_shops_visited,
        COALESCE(SUM(di.quantity), 0) AS total_units_sold,
        COALESCE(SUM(di.subtotal), 0) AS total_revenue
      FROM deliveries d
      LEFT JOIN delivery_items di ON di.delivery_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND d.delivery_date = ?';
      params.push(date);
    } else if (from && to) {
      query += ' AND d.delivery_date BETWEEN ? AND ?';
      params.push(from, to);
    }

    query += ' GROUP BY d.delivery_date ORDER BY d.delivery_date DESC';

    const dailyData = await db.all(query, params);

    res.json({ success: true, count: dailyData.length, data: dailyData });
  } catch (err) {
    next(err);
  }
}

async function getMonthlyReport(req, res, next) {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear().toString();

    const query = `
      SELECT 
        strftime('%Y-%m', d.delivery_date) AS month,
        COUNT(DISTINCT d.id) AS deliveries_count,
        COUNT(DISTINCT d.shop_id) AS unique_shops,
        COALESCE(SUM(di.quantity), 0) AS total_units,
        COALESCE(SUM(di.subtotal), 0) AS total_revenue,
        CASE 
          WHEN COUNT(DISTINCT d.id) > 0 THEN COALESCE(SUM(di.subtotal), 0) / COUNT(DISTINCT d.id) 
          ELSE 0 
        END AS avg_delivery_value
      FROM deliveries d
      LEFT JOIN delivery_items di ON di.delivery_id = d.id
      WHERE strftime('%Y', d.delivery_date) = ?
      GROUP BY strftime('%Y-%m', d.delivery_date)
      ORDER BY month ASC
    `;

    const monthlyData = await db.all(query, [targetYear]);

    res.json({ success: true, year: targetYear, count: monthlyData.length, data: monthlyData });
  } catch (err) {
    next(err);
  }
}

async function getProductReport(req, res, next) {
  try {
    const { from, to } = req.query;

    let query = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.category,
        p.size,
        p.retail_price,
        COALESCE(SUM(di.quantity), 0) AS total_units_sold,
        COALESCE(SUM(di.subtotal), 0) AS total_revenue,
        COUNT(DISTINCT d.id) AS deliveries_included_count
      FROM products p
      LEFT JOIN delivery_items di ON di.product_id = p.id
      LEFT JOIN deliveries d ON d.id = di.delivery_id
    `;
    const params = [];

    if (from && to) {
      query += ' WHERE (d.delivery_date BETWEEN ? AND ? OR d.id IS NULL)';
      params.push(from, to);
    }

    query += ' GROUP BY p.id ORDER BY total_revenue DESC';

    const productData = await db.all(query, params);

    res.json({ success: true, count: productData.length, data: productData });
  } catch (err) {
    next(err);
  }
}

async function getShopReport(req, res, next) {
  try {
    const { from, to, route } = req.query;

    let query = `
      SELECT 
        s.id AS shop_id,
        s.shop_name,
        s.owner_name,
        s.route,
        s.phone,
        COUNT(DISTINCT d.id) AS total_deliveries,
        COALESCE(SUM(di.subtotal), 0) AS total_revenue,
        COALESCE(SUM(di.quantity), 0) AS total_units_purchased,
        MAX(d.delivery_date) AS last_delivery_date
      FROM shops s
      LEFT JOIN deliveries d ON d.shop_id = s.id
      LEFT JOIN delivery_items di ON di.delivery_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (from && to) {
      query += ' AND (d.delivery_date BETWEEN ? AND ? OR d.id IS NULL)';
      params.push(from, to);
    }

    if (route) {
      query += ' AND s.route = ?';
      params.push(route);
    }

    query += ' GROUP BY s.id ORDER BY total_revenue DESC';

    const shopData = await db.all(query, params);

    res.json({ success: true, count: shopData.length, data: shopData });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getProductReport,
  getShopReport
};
