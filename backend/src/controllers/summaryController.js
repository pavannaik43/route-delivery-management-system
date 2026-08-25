const { db } = require('../db');
const { getStockSummary } = require('../services/stockCalculator');

async function getDaySummary(req, res, next) {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Deliveries summary
    const delSummary = await db.get(
      `SELECT 
        COUNT(id) AS total_deliveries,
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(AVG(total_amount), 0) AS avg_order_value
       FROM deliveries
       WHERE delivery_date = ?`,
      [targetDate]
    );

    // Stock breakdown
    const stock = await getStockSummary(targetDate);

    // Top selling product for the day
    const topProductRow = await db.get(
      `SELECT 
        p.name AS product_name,
        p.category,
        p.size,
        SUM(di.quantity) AS total_qty_sold,
        SUM(di.subtotal) AS total_sales_value
       FROM delivery_items di
       JOIN deliveries d ON d.id = di.delivery_id
       JOIN products p ON p.id = di.product_id
       WHERE d.delivery_date = ?
       GROUP BY p.id
       ORDER BY total_qty_sold DESC
       LIMIT 1`,
      [targetDate]
    );

    // Full product-wise reconciliation table
    const reconciliation = stock.map(item => {
      const valueSold = Math.round(item.deliveredQuantity * item.retailPrice * 100) / 100;
      const valueRemaining = Math.round(item.remainingStock * item.retailPrice * 100) / 100;
      const valueLoaded = Math.round(item.loadedQuantity * item.retailPrice * 100) / 100;

      return {
        productId: item.productId,
        productName: item.productName,
        category: item.category,
        size: item.size,
        retailPrice: item.retailPrice,
        mrp: item.mrp,
        loadedQuantity: item.loadedQuantity,
        deliveredQuantity: item.deliveredQuantity,
        remainingStock: item.remainingStock,
        valueLoaded,
        valueSold,
        valueRemaining,
        clearanceRate: item.loadedQuantity > 0 ? Math.round((item.deliveredQuantity / item.loadedQuantity) * 100) : 0
      };
    });

    // Delivered shops breakdown
    const shopsDelivered = await db.all(
      `SELECT 
        s.id AS shop_id,
        s.shop_name,
        s.route,
        d.invoice_no,
        d.total_amount,
        COUNT(di.id) AS items_count,
        SUM(di.quantity) AS units_count
       FROM deliveries d
       JOIN shops s ON s.id = d.shop_id
       LEFT JOIN delivery_items di ON di.delivery_id = d.id
       WHERE d.delivery_date = ?
       GROUP BY d.id
       ORDER BY d.id ASC`,
      [targetDate]
    );

    const totals = {
      totalRevenue: Number(delSummary.total_revenue) || 0,
      totalDeliveries: Number(delSummary.total_deliveries) || 0,
      avgOrderValue: Math.round((Number(delSummary.avg_order_value) || 0) * 100) / 100,
      totalLoadedUnits: stock.reduce((s, i) => s + i.loadedQuantity, 0),
      totalDeliveredUnits: stock.reduce((s, i) => s + i.deliveredQuantity, 0),
      totalRemainingUnits: stock.reduce((s, i) => s + i.remainingStock, 0),
      totalLoadedValue: reconciliation.reduce((s, i) => s + i.valueLoaded, 0),
      totalDeliveredValue: reconciliation.reduce((s, i) => s + i.valueSold, 0),
      totalRemainingValue: reconciliation.reduce((s, i) => s + i.valueRemaining, 0)
    };

    res.json({
      success: true,
      date: targetDate,
      totals,
      topProduct: topProductRow || null,
      reconciliation,
      shopsDelivered
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDaySummary
};
