const { db } = require('../db');

/**
 * Calculates stock figures (loaded, delivered, remaining) for a given date.
 * Derived dynamically from vehicle_load and delivery_items.
 */
async function getStockSummary(date = null, productId = null) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  let query = `
    SELECT 
      p.id AS product_id,
      p.name AS product_name,
      p.category,
      p.size,
      p.mrp,
      p.retail_price,
      p.image,
      p.status,
      vl.id AS load_id,
      COALESCE(vl.quantity, 0) AS loaded_quantity,
      COALESCE(SUM(di.quantity), 0) AS delivered_quantity,
      (COALESCE(vl.quantity, 0) - COALESCE(SUM(di.quantity), 0)) AS remaining_stock
    FROM products p
    LEFT JOIN vehicle_load vl 
      ON p.id = vl.product_id AND vl.load_date = ?
    LEFT JOIN deliveries d 
      ON d.delivery_date = ?
    LEFT JOIN delivery_items di 
      ON di.delivery_id = d.id AND di.product_id = p.id
    WHERE 1=1
  `;

  const params = [targetDate, targetDate];

  if (productId) {
    query += ' AND p.id = ?';
    params.push(productId);
  }

  query += ' GROUP BY p.id ORDER BY p.category, p.name ASC';

  const rows = await db.all(query, params);

  return rows.map(item => {
    const loaded = Number(item.loaded_quantity);
    const delivered = Number(item.delivered_quantity);
    const remaining = Number(item.remaining_stock);
    
    let stockStatus = 'normal';
    if (loaded === 0) {
      stockStatus = 'not_loaded';
    } else if (remaining <= 0) {
      stockStatus = 'out_of_stock';
    } else if (remaining <= 5 || remaining <= loaded * 0.15) {
      stockStatus = 'low_stock';
    }

    return {
      productId: item.product_id,
      productName: item.product_name,
      category: item.category,
      size: item.size,
      mrp: Number(item.mrp),
      retailPrice: Number(item.retail_price),
      image: item.image,
      status: item.status,
      loadId: item.load_id,
      date: targetDate,
      loadedQuantity: loaded,
      deliveredQuantity: delivered,
      remainingStock: Math.max(0, remaining),
      rawRemaining: remaining,
      stockStatus
    };
  });
}

/**
 * Validates whether a delivery of specific items can proceed without exceeding stock.
 * Throws an error with details if any product has insufficient stock.
 */
async function validateStockForDelivery(items, date) {
  const stockList = await getStockSummary(date);
  const stockMap = new Map(stockList.map(s => [s.productId, s]));

  for (const item of items) {
    const stockInfo = stockMap.get(Number(item.productId || item.product_id));
    if (!stockInfo) {
      throw new Error(`Product ID ${item.productId || item.product_id} not found.`);
    }

    const requestedQty = Number(item.quantity);
    if (requestedQty <= 0) {
      throw new Error(`Quantity for "${stockInfo.productName}" must be greater than 0.`);
    }

    if (requestedQty > stockInfo.rawRemaining) {
      throw new Error(
        `Insufficient vehicle stock for "${stockInfo.productName}". Available: ${stockInfo.rawRemaining}, Requested: ${requestedQty}.`
      );
    }
  }
}

module.exports = {
  getStockSummary,
  validateStockForDelivery
};
