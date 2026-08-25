const { db } = require('../db');

async function getProducts(req, res, next) {
  try {
    const { category, status, search } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY category, name ASC';

    const products = await db.all(query, params);
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const { name, category, size, mrp, retail_price, image, status } = req.body;

    if (!name || mrp === undefined || retail_price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product name, MRP, and retail price are required.'
      });
    }

    const result = await db.run(
      `INSERT INTO products (name, category, size, mrp, retail_price, image, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category ? category.trim() : 'General',
        size ? size.trim() : 'Standard',
        Number(mrp),
        Number(retail_price),
        image || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80',
        status === 'inactive' ? 'inactive' : 'active'
      ]
    );

    const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, message: 'Product created successfully', product: newProduct });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, category, size, mrp, retail_price, image, status } = req.body;

    const existing = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await db.run(
      `UPDATE products 
       SET name = ?, category = ?, size = ?, mrp = ?, retail_price = ?, image = ?, status = ?
       WHERE id = ?`,
      [
        name !== undefined ? name.trim() : existing.name,
        category !== undefined ? category.trim() : existing.category,
        size !== undefined ? size.trim() : existing.size,
        mrp !== undefined ? Number(mrp) : existing.mrp,
        retail_price !== undefined ? Number(retail_price) : existing.retail_price,
        image !== undefined ? image : existing.image,
        status !== undefined ? status : existing.status,
        id
      ]
    );

    const updated = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product updated successfully', product: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    // Check if referenced in deliveries or vehicle loads
    const loadRef = await db.get('SELECT COUNT(*) as count FROM vehicle_load WHERE product_id = ?', [id]);
    const deliveryRef = await db.get('SELECT COUNT(*) as count FROM delivery_items WHERE product_id = ?', [id]);

    if (loadRef.count > 0 || deliveryRef.count > 0) {
      // Soft-delete by setting status to inactive
      await db.run('UPDATE products SET status = "inactive" WHERE id = ?', [id]);
      return res.json({
        success: true,
        message: 'Product has transaction history. It was marked as inactive instead of permanent deletion.'
      });
    }

    await db.run('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
