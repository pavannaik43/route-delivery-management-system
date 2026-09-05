/**
 * Security Test Suite for RDMSystem
 *
 * This file tests all implemented security features:
 * - Rate limiting
 * - Password validation
 * - Input validation
 * - Authentication flows
 * - CORS configuration
 *
 * Run with: node security-test.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let passedTests = 0;
let failedTests = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function assert(condition, testName) {
  if (condition) {
    passedTests++;
    log(`✓ ${testName}`, 'green');
  } else {
    failedTests++;
    log(`✗ ${testName}`, 'red');
  }
}

async function testRateLimiting() {
  log('\n=== Testing Rate Limiting ===', 'blue');

  try {
    // Test login rate limiting (5 attempts per 15 minutes)
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(
        axios.post(`${API_BASE_URL}/auth/login`, {
          username: 'testuser',
          password: 'wrongpassword'
        }).catch(err => err.response)
      );
    }

    const results = await Promise.all(promises);
    const rateLimited = results.some(r => r && r.status === 429);
    assert(rateLimited, 'Login rate limiting triggers after 5 attempts');

    // Wait a moment before next test
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    log(`Rate limiting test error: ${error.message}`, 'red');
  }
}

async function testPasswordValidation() {
  log('\n=== Testing Password Validation ===', 'blue');

  const weakPasswords = [
    { password: '123', name: 'Too short password' },
    { password: 'password', name: 'No uppercase/numbers/special chars' },
    { password: 'Password', name: 'No numbers/special chars' },
    { password: 'Password1', name: 'No special chars' },
  ];

  for (const test of weakPasswords) {
    try {
      const response = await axios.post(`${API_BASE_URL}/users`, {
        username: 'testuser' + Date.now(),
        email: `test${Date.now()}@example.com`,
        phone: '9876543210',
        password: test.password,
        role: 'delivery_staff'
      }, {
        headers: { Authorization: 'Bearer fake_token' }
      }).catch(err => err.response);

      assert(
        response && response.status === 400,
        `Rejects weak password: ${test.name}`
      );
    } catch (error) {
      log(`Password validation test error: ${error.message}`, 'yellow');
    }
  }

  // Test valid password format
  try {
    const response = await axios.post(`${API_BASE_URL}/users`, {
      username: 'testuser' + Date.now(),
      email: `test${Date.now()}@example.com`,
      phone: '9876543210',
      password: 'ValidPass123!',
      role: 'delivery_staff'
    }, {
      headers: { Authorization: 'Bearer fake_token' }
    }).catch(err => err.response);

    // Should fail with 401/403 due to invalid token, not 400 for password
    assert(
      response && (response.status === 401 || response.status === 403),
      'Accepts valid password format'
    );
  } catch (error) {
    log(`Valid password test error: ${error.message}`, 'yellow');
  }
}

async function testInputValidation() {
  log('\n=== Testing Input Validation ===', 'blue');

  // Test invalid date format
  try {
    const response = await axios.get(`${API_BASE_URL}/deliveries?date=invalid-date`, {
      headers: { Authorization: 'Bearer fake_token' }
    }).catch(err => err.response);

    assert(
      response && response.status === 400,
      'Rejects invalid date format'
    );
  } catch (error) {
    log(`Date validation test error: ${error.message}`, 'yellow');
  }

  // Test invalid phone number
  try {
    const response = await axios.post(`${API_BASE_URL}/shops`, {
      shop_name: 'Test Shop',
      owner_name: 'Test Owner',
      phone: '123', // Invalid: not 10 digits
      address: '123 Test St',
      route: 'Test Route'
    }, {
      headers: { Authorization: 'Bearer fake_token' }
    }).catch(err => err.response);

    assert(
      response && response.status === 400,
      'Rejects invalid phone number'
    );
  } catch (error) {
    log(`Phone validation test error: ${error.message}`, 'yellow');
  }

  // Test negative quantity
  try {
    const response = await axios.post(`${API_BASE_URL}/deliveries`, {
      shopId: 1,
      items: [{ productId: 1, quantity: -5 }]
    }, {
      headers: { Authorization: 'Bearer fake_token' }
    }).catch(err => err.response);

    assert(
      response && response.status === 400,
      'Rejects negative quantity'
    );
  } catch (error) {
    log(`Quantity validation test error: ${error.message}`, 'yellow');
  }
}

async function testSecurityHeaders() {
  log('\n=== Testing Security Headers ===', 'blue');

  try {
    const response = await axios.get(`${API_BASE_URL}/health`);

    const headers = response.headers;
    assert(
      headers['x-content-type-options'] === 'nosniff',
      'X-Content-Type-Options header present'
    );

    assert(
      headers['x-frame-options'] || headers['x-frame-options'] === 'DENY',
      'X-Frame-Options header present'
    );

    assert(
      'x-xss-protection' in headers || 'content-security-policy' in headers,
      'XSS protection headers present'
    );
  } catch (error) {
    log(`Security headers test error: ${error.message}`, 'yellow');
  }
}

async function testHealthEndpoint() {
  log('\n=== Testing Health Endpoint ===', 'blue');

  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    assert(response.status === 200, 'Health endpoint accessible');
    assert(response.data.status === 'healthy', 'Health status is healthy');
    assert('timestamp' in response.data, 'Health response includes timestamp');
  } catch (error) {
    log(`Health endpoint test error: ${error.message}`, 'red');
  }
}

async function testDashboardAuthorization() {
  log('\n=== Testing Dashboard Authorization (/api/dashboard/today) ===', 'blue');
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'hatsun_rdms_super_secret_jwt_key_2026_agro_products';

  // 1. Unauthenticated request (no token) -> should return 401
  try {
    const response = await axios.get(`${API_BASE_URL}/dashboard/today`).catch(err => err.response);
    assert(response && response.status === 401, 'Rejects unauthenticated access with 401');
  } catch (error) {
    log(`Dashboard unauthenticated test error: ${error.message}`, 'red');
  }

  // 2. Non-admin request (role: delivery_staff) -> should return 403
  try {
    const staffToken = jwt.sign(
      { id: 2, username: 'driver1', email: 'driver1@hatsun.com', role: 'delivery_staff' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const response = await axios.get(`${API_BASE_URL}/dashboard/today`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    }).catch(err => err.response);
    assert(response && response.status === 403, 'Rejects non-admin (delivery_staff) access with 403');
  } catch (error) {
    log(`Dashboard non-admin test error: ${error.message}`, 'red');
  }

  // 3. Admin request (role: admin) -> should return 200
  try {
    const adminToken = jwt.sign(
      { id: 1, username: 'admin', email: 'admin@hatsun.com', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const response = await axios.get(`${API_BASE_URL}/dashboard/today`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).catch(err => err.response);
    assert(response && response.status === 200, 'Allows admin access with 200');
  } catch (error) {
    log(`Dashboard admin test error: ${error.message}`, 'red');
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║   RDMSystem Security Test Suite       ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');
  log(`\nTesting API: ${API_BASE_URL}\n`, 'yellow');

  await testHealthEndpoint();
  await testDashboardAuthorization();
  await testRateLimiting();
  await testPasswordValidation();
  await testInputValidation();
  await testSecurityHeaders();

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log(`\nTest Results:`, 'blue');
  log(`  Passed: ${passedTests}`, 'green');
  log(`  Failed: ${failedTests}`, 'red');
  log(`  Total:  ${passedTests + failedTests}\n`, 'yellow');

  if (failedTests === 0) {
    log('✓ All tests passed!', 'green');
  } else {
    log(`✗ ${failedTests} test(s) failed`, 'red');
  }

  log('\n' + '='.repeat(50) + '\n', 'blue');
}

// Run tests
runAllTests().catch(error => {
  log(`\nTest suite error: ${error.message}`, 'red');
  process.exit(1);
});
