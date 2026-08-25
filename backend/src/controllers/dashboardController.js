const { db } = require('../db');
const { getStockSummary } = require('../services/stockCalculator');

async function getTodayDashboard(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Deliveries summary for today
    const delSummary = await db.get(
      `SELECT 
        COUNT(id) AS total_deliveries,
        COALESCE(SUM(total_amount), 0) AS total_revenue
       FROM deliveries
       WHERE delivery_date = ?`,
      [today]
    );

    // 2. Units delivered
    const unitsSummary = await db.get(
      `SELECT 
        COALESCE(SUM(di.quantity), 0) AS total_units_delivered
       FROM delivery_items di
       JOIN deliveries d ON d.id = di.delivery_id
       WHERE d.delivery_date = ?`,
      [today]
    );

    // 3. Stock Summary for today
    const stock = await getStockSummary(today);
    const totalLoaded = stock.reduce((sum, item) => sum + item.loadedQuantity, 0);
    const totalDelivered = stock.reduce((sum, item) => sum + item.deliveredQuantity, 0);
    const totalRemaining = stock.reduce((sum, item) => sum + item.remainingStock, 0);
    const lowStockAlerts = stock.filter(item => item.stockStatus === 'low_stock' || item.stockStatus === 'out_of_stock');

    // 4. Top Selling Product today
    const topProductRow = await db.get(
      `SELECT 
        p.name AS product_name,
        p.category,
        SUM(di.quantity) AS total_qty_sold,
        SUM(di.subtotal) AS total_sales_value
       FROM delivery_items di
       JOIN deliveries d ON d.id = di.delivery_id
       JOIN products p ON p.id = di.product_id
       WHERE d.delivery_date = ?
       GROUP BY p.id
       ORDER BY total_qty_sold DESC
       LIMIT 1`,
      [today]
    );

    // 5. Category-wise sales today
    const categorySales = await db.all(
      `SELECT 
        p.category,
        SUM(di.quantity) AS units_sold,
        SUM(di.subtotal) AS total_revenue
       FROM delivery_items di
       JOIN deliveries d ON d.id = di.delivery_id
       JOIN products p ON p.id = di.product_id
       WHERE d.delivery_date = ?
       GROUP BY p.category
       ORDER BY total_revenue DESC`,
      [today]
    );

    // 6. Route Delivery Progress
    const allRoutes = await db.all(
      `SELECT route, COUNT(id) as total_shops FROM shops WHERE route IS NOT NULL GROUP BY route`
    );
    const completedRoutes = await db.all(
      `SELECT s.route, COUNT(DISTINCT d.shop_id) as delivered_shops
       FROM deliveries d
       JOIN shops s ON s.id = d.shop_id
       WHERE d.delivery_date = ?
       GROUP BY s.route`,
      [today]
    );

    const completedMap = new Map(completedRoutes.map(r => [r.route, r.delivered_shops]));
    const routeProgress = allRoutes.map(r => ({
      route: r.route,
      totalShops: r.total_shops,
      deliveredShops: completedMap.get(r.route) || 0,
      percentage: Math.round(((completedMap.get(r.route) || 0) / r.total_shops) * 100)
    }));

    // 7. Recent 5 Deliveries
    const recentDeliveries = await db.all(
      `SELECT 
        d.id,
        d.invoice_no,
        d.total_amount,
        d.created_at,
        s.shop_name,
        s.route,
        u.username AS delivered_by
       FROM deliveries d
       JOIN shops s ON s.id = d.shop_id
       LEFT JOIN users u ON u.id = d.delivered_by
       WHERE d.delivery_date = ?
       ORDER BY d.id DESC LIMIT 5`,
      [today]
    );

    res.json({
      success: true,
      date: today,
      kpis: {
        totalRevenue: Number(delSummary.total_revenue) || 0,
        totalDeliveries: Number(delSummary.total_deliveries) || 0,
        totalUnitsDelivered: Number(unitsSummary.total_units_delivered) || 0,
        totalLoaded,
        totalRemaining,
        lowStockCount: lowStockAlerts.length,
        stockUtilizationPercent: totalLoaded > 0 ? Math.round((totalDelivered / totalLoaded) * 100) : 0,
        topProduct: topProductRow || { product_name: 'None', total_qty_sold: 0, total_sales_value: 0 }
      },
      categorySales,
      routeProgress,
      recentDeliveries,
      lowStockAlerts: lowStockAlerts.slice(0, 5)
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTodayDashboard
};
