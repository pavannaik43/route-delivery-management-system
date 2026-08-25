const bcrypt = require('bcryptjs');
const { db, getDb } = require('./index');

async function seed() {
  console.log('Initializing database schema and seeding initial data...');
  await getDb();

  // Check if users already exist
  const existingUsers = await db.all('SELECT COUNT(*) as count FROM users');
  if (existingUsers[0].count > 0) {
    console.log('Database already contains data. Skipping full seed.');
    return;
  }

  // 1. Seed Users
  console.log('Seeding Users...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const driverPassword = await bcrypt.hash('driver123', salt);

  await db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    ['admin', adminPassword, 'admin']
  );
  await db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    ['driver1', driverPassword, 'delivery_staff']
  );
  await db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    ['driver2', driverPassword, 'delivery_staff']
  );

  // 2. Seed Products (Hatsun Agro Brands)
  console.log('Seeding Products...');
  const products = [
    {
      name: 'Arokya Full Cream Milk',
      category: 'Milk',
      size: '500ml',
      mrp: 35.0,
      retail_price: 32.0,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Arokya Standardized Milk',
      category: 'Milk',
      size: '500ml',
      mrp: 30.0,
      retail_price: 27.5,
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Arokya Toned Milk',
      category: 'Milk',
      size: '1000ml',
      mrp: 54.0,
      retail_price: 50.0,
      image: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Hatsun Curd Pouch',
      category: 'Curd',
      size: '500g',
      mrp: 38.0,
      retail_price: 34.0,
      image: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Hatsun Cup Curd',
      category: 'Curd',
      size: '200g',
      mrp: 20.0,
      retail_price: 17.5,
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Hatsun Pure Cow Ghee',
      category: 'Ghee',
      size: '500ml',
      mrp: 340.0,
      retail_price: 310.0,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Hatsun Pure Cow Ghee',
      category: 'Ghee',
      size: '200ml',
      mrp: 150.0,
      retail_price: 135.0,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Hatsun Fresh Paneer',
      category: 'Paneer',
      size: '200g',
      mrp: 95.0,
      retail_price: 84.0,
      image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Hatsun Butter (Salted)',
      category: 'Butter',
      size: '500g',
      mrp: 275.0,
      retail_price: 250.0,
      image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Arun Vanilla Chocobar',
      category: 'Ice Cream',
      size: '70ml',
      mrp: 25.0,
      retail_price: 20.0,
      image: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Arun Mango Duet',
      category: 'Ice Cream',
      size: '60ml',
      mrp: 30.0,
      retail_price: 24.0,
      image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Arun Cassata Ice Cream',
      category: 'Ice Cream',
      size: '150ml',
      mrp: 65.0,
      retail_price: 52.0,
      image: 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=300&q=80',
      status: 'active'
    },
    {
      name: 'Arun Butterscotch Tub',
      category: 'Ice Cream',
      size: '1000ml',
      mrp: 220.0,
      retail_price: 185.0,
      image: 'https://images.unsplash.com/photo-1568651316790-25c27636e0bb?w=300&q=80',
      status: 'active'
    }
  ];

  for (const prod of products) {
    await db.run(
      'INSERT INTO products (name, category, size, mrp, retail_price, image, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [prod.name, prod.category, prod.size, prod.mrp, prod.retail_price, prod.image, prod.status]
    );
  }

  // 3. Seed Shops
  console.log('Seeding Shops...');
  const shops = [
    {
      shop_name: 'Sri Krishna Dairy & Sweets',
      owner_name: 'S. Sundaram',
      phone: '+91 98401 23456',
      address: '12, 2nd Avenue, Anna Nagar East, Chennai',
      route: 'Route 1 - Anna Nagar'
    },
    {
      shop_name: 'Annai Supermarket',
      owner_name: 'K. Meenakshi',
      phone: '+91 98402 34567',
      address: '45, Shanthi Colony, Anna Nagar, Chennai',
      route: 'Route 1 - Anna Nagar'
    },
    {
      shop_name: 'Murugan Provisions',
      owner_name: 'M. Ramaswamy',
      phone: '+91 98403 45678',
      address: '89, 4th Main Road, Anna Nagar West, Chennai',
      route: 'Route 1 - Anna Nagar'
    },
    {
      shop_name: 'Daily Fresh Mart',
      owner_name: 'J. Robert',
      phone: '+91 98404 56789',
      address: '104, 11th Main Road, Anna Nagar, Chennai',
      route: 'Route 1 - Anna Nagar'
    },
    {
      shop_name: 'Ponni Super Stores',
      owner_name: 'V. Karthik',
      phone: '+91 98405 67890',
      address: '15, Usman Road, T Nagar, Chennai',
      route: 'Route 2 - T Nagar'
    },
    {
      shop_name: 'Tirumala Milk Centre',
      owner_name: 'T. Venkatesh',
      phone: '+91 98406 78901',
      address: '78, Pondy Bazaar, T Nagar, Chennai',
      route: 'Route 2 - T Nagar'
    },
    {
      shop_name: 'Lakshmi Stores',
      owner_name: 'L. Radhakrishnan',
      phone: '+91 98407 89012',
      address: '34, Venkatnarayana Road, T Nagar, Chennai',
      route: 'Route 2 - T Nagar'
    },
    {
      shop_name: 'Grand Fresh Hypermarket',
      owner_name: 'P. Anand',
      phone: '+91 98409 01234',
      address: '22, Bypass Road, Velachery, Chennai',
      route: 'Route 3 - Velachery'
    },
    {
      shop_name: 'Cauvery Milk Point',
      owner_name: 'R. Murugesan',
      phone: '+91 98410 12345',
      address: '108, 100 Feet Road, Velachery, Chennai',
      route: 'Route 3 - Velachery'
    },
    {
      shop_name: 'Sri Balaji Stores',
      owner_name: 'N. Balaji',
      phone: '+91 98411 23456',
      address: '67, Taramani Link Road, Velachery, Chennai',
      route: 'Route 3 - Velachery'
    }
  ];

  for (const shop of shops) {
    await db.run(
      'INSERT INTO shops (shop_name, owner_name, phone, address, route) VALUES (?, ?, ?, ?, ?)',
      [shop.shop_name, shop.owner_name, shop.phone, shop.address, shop.route]
    );
  }

  // 4. Seed Today's Initial Vehicle Load
  console.log("Seeding Today's Vehicle Load...");
  const today = new Date().toISOString().split('T')[0];
  const allProds = await db.all('SELECT id, name FROM products');

  const defaultLoads = [
    { name: 'Arokya Full Cream Milk', qty: 120 },
    { name: 'Arokya Standardized Milk', qty: 100 },
    { name: 'Arokya Toned Milk', qty: 60 },
    { name: 'Hatsun Curd Pouch', qty: 80 },
    { name: 'Hatsun Cup Curd', qty: 50 },
    { name: 'Hatsun Pure Cow Ghee', qty: 25 },
    { name: 'Hatsun Fresh Paneer', qty: 40 },
    { name: 'Hatsun Butter (Salted)', qty: 30 },
    { name: 'Arun Vanilla Chocobar', qty: 50 },
    { name: 'Arun Mango Duet', qty: 40 },
    { name: 'Arun Cassata Ice Cream', qty: 20 },
    { name: 'Arun Butterscotch Tub', qty: 15 }
  ];

  for (const item of defaultLoads) {
    const prod = allProds.find(p => p.name === item.name);
    if (prod) {
      await db.run(
        'INSERT INTO vehicle_load (product_id, quantity, load_date, loaded_by) VALUES (?, ?, ?, ?)',
        [prod.id, item.qty, today, 2] // loaded by driver1
      );
    }
  }

  // 5. Seed 1 sample completed delivery for today to showcase immediate data
  console.log('Seeding Sample Delivery & Invoice...');
  const shop = await db.get('SELECT id FROM shops WHERE shop_name = ?', ['Sri Krishna Dairy & Sweets']);
  const milk1 = allProds.find(p => p.name === 'Arokya Full Cream Milk');
  const curd1 = allProds.find(p => p.name === 'Hatsun Curd Pouch');
  const paneer1 = allProds.find(p => p.name === 'Hatsun Fresh Paneer');

  const dateFormatted = today.replace(/-/g, '');
  const invoiceNo = `INV-${dateFormatted}-0001`;

  const totalAmount = (20 * 32.0) + (15 * 34.0) + (5 * 84.0); // 640 + 510 + 420 = 1570

  const delRes = await db.run(
    'INSERT INTO deliveries (shop_id, invoice_no, delivery_date, total_amount, delivered_by) VALUES (?, ?, ?, ?, ?)',
    [shop.id, invoiceNo, today, totalAmount, 2]
  );
  const deliveryId = delRes.lastInsertRowid;

  await db.run(
    'INSERT INTO delivery_items (delivery_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
    [deliveryId, milk1.id, 20, 32.0, 640.0]
  );
  await db.run(
    'INSERT INTO delivery_items (delivery_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
    [deliveryId, curd1.id, 15, 34.0, 510.0]
  );
  await db.run(
    'INSERT INTO delivery_items (delivery_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
    [deliveryId, paneer1.id, 5, 84.0, 420.0]
  );

  console.log('Seeding completed successfully! Default accounts: admin/admin123, driver1/driver123');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}

module.exports = seed;
