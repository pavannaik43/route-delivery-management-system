const { getStockSummary } = require('../services/stockCalculator');

async function getStock(req, res, next) {
  try {
    const { date, product_id } = req.query;
    const stock = await getStockSummary(date, product_id ? Number(product_id) : null);

    const totalLoaded = stock.reduce((sum, item) => sum + item.loadedQuantity, 0);
    const totalDelivered = stock.reduce((sum, item) => sum + item.deliveredQuantity, 0);
    const totalRemaining = stock.reduce((sum, item) => sum + item.remainingStock, 0);
    const lowStockCount = stock.filter(item => item.stockStatus === 'low_stock' || item.stockStatus === 'out_of_stock').length;

    res.json({
      success: true,
      date: date || new Date().toISOString().split('T')[0],
      summary: {
        totalLoaded,
        totalDelivered,
        totalRemaining,
        lowStockCount,
        productsCount: stock.length
      },
      stock
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStock
};
