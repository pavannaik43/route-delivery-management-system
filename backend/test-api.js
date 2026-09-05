const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- RUNNING BACKEND API TESTS ---');

  // 1. Health check
  const health = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log('1. Health Check:', health.status === 200 ? 'PASS' : 'FAIL', health.data);

  // 2. Admin Login
  const adminLogin = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'admin', email: 'admin@rdms.com', password: 'admin123' });
  console.log('2. Admin Login:', adminLogin.status === 200 ? 'PASS' : 'FAIL', 'Token received:', !!adminLogin.data.token);
  const adminToken = adminLogin.data.token;

  // 3. Driver Login
  const driverLogin = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'driver1', email: 'driver1@rdms.com', password: 'driver123' });
  console.log('3. Driver Login:', driverLogin.status === 200 ? 'PASS' : 'FAIL', 'Role:', driverLogin.data.user?.role);
  const driverToken = driverLogin.data.token;

  // 4. Products List
  const productsRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${driverToken}` }
  });
  console.log('4. Fetch Products:', productsRes.status === 200 ? 'PASS' : 'FAIL', `Count: ${productsRes.data.products?.length}`);

  // 5. RBAC Protection test: Driver attempting admin-only user creation
  const rbacTest = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverToken}` }
  }, { username: 'testuser', password: '123', role: 'delivery_staff' });
  console.log('5. RBAC Guard (Driver -> Admin route 403):', rbacTest.status === 403 ? 'PASS' : 'FAIL');

  // 6. Stock Check
  const stockRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/stock',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${driverToken}` }
  });
  console.log('6. Stock Engine:', stockRes.status === 200 ? 'PASS' : 'FAIL', 'Summary:', stockRes.data.summary);

  // 7. Overselling Prevention Test (Business Rule #2 & #3)
  const oversizeDelivery = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/deliveries',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverToken}` }
  }, {
    shopId: 2,
    items: [{ productId: 1, quantity: 9999, unitPrice: 32.0 }]
  });
  console.log('7. Oversell Prevention Test (400 rejected):', oversizeDelivery.status === 400 ? 'PASS' : 'FAIL', oversizeDelivery.data.message);

  // 7b. Seed today load for testing
  const today = new Date().toISOString().split('T')[0];
  await request({
    host: 'localhost',
    port: 5000,
    path: '/api/loads',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverToken}` }
  }, {
    loadDate: today,
    items: [
      { productId: 1, quantity: 50 },
      { productId: 2, quantity: 30 }
    ]
  });

  // 8. Successful Delivery & Atomic Invoice Creation (Business Rule #4 & #6)
  const validDelivery = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/deliveries',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverToken}` }
  }, {
    shopId: 2,
    items: [
      { productId: 1, quantity: 10, unitPrice: 32.0 },
      { productId: 2, quantity: 5, unitPrice: 27.5 }
    ]
  });
  console.log('8. Valid Delivery Creation:', validDelivery.status === 201 ? 'PASS' : 'FAIL', 'Generated Invoice:', validDelivery.data?.delivery?.invoiceNo);

  // 9. Dashboard KPIs
  const dashboardRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/dashboard/today',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('9. Dashboard KPIs:', dashboardRes.status === 200 ? 'PASS' : 'FAIL', dashboardRes.data?.kpis);

  console.log('--- ALL BACKEND CORE TESTS COMPLETED ---');
}

runTests().catch(console.error);
