const mongoose = require('mongoose');
const assert = require('assert');
const http = require('http');

const User = require('./models/User');
const Goal = require('./models/Goal');
const Trip = require('./models/Trip');
const DebtAnalysis = require('./models/DebtAnalysis');

// Load environment variables manually
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finpilot';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper: Make HTTP request to Express server
const makeRequest = (method, path, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('Frying up MERN backend Integration Tests...');
  const randomEmail = `testuser_${Math.floor(Math.random() * 100000)}@test.com`;
  let token = '';
  let userId = '';

  try {
    // 1. Register test user
    console.log('Testing auth/register endpoint...');
    const regRes = await makeRequest('POST', '/auth/register', {}, {
      name: 'Integration Test User',
      email: randomEmail,
      password: 'testpassword123',
      age: 28,
      monthlyIncome: 85000
    });

    assert.strictEqual(regRes.statusCode, 201, 'Register status code should be 201');
    assert.strictEqual(regRes.body.status, 'success', 'Register status should be success');
    assert.ok(regRes.body.token, 'Response should contain JWT token');
    token = regRes.body.token;
    userId = regRes.body.user.id;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // 2. Login test user
    console.log('Testing auth/login endpoint...');
    const loginRes = await makeRequest('POST', '/auth/login', {}, {
      email: randomEmail,
      password: 'testpassword123'
    });
    assert.strictEqual(loginRes.statusCode, 200, 'Login status code should be 200');
    assert.strictEqual(loginRes.body.status, 'success', 'Login status should be success');
    assert.strictEqual(loginRes.body.token, token, 'Login token should match register token');

    // 3. Create Goal
    console.log('Testing POST /goals/create endpoint...');
    const goalRes = await makeRequest('POST', '/goals/create', authHeaders, {
      goalName: 'Test Vacation Goal',
      targetAmount: 100000,
      currentSavings: 20000,
      targetDate: '2027-12-31'
    });
    assert.strictEqual(goalRes.statusCode, 201);
    assert.strictEqual(goalRes.body.status, 'success');
    assert.strictEqual(goalRes.body.data.goalName, 'Test Vacation Goal');
    assert.strictEqual(goalRes.body.data.progress, 20);

    // 4. Get Goals
    console.log('Testing GET /goals endpoint...');
    const goalsRes = await makeRequest('GET', '/goals', authHeaders);
    assert.strictEqual(goalsRes.statusCode, 200);
    assert.strictEqual(goalsRes.body.status, 'success');
    assert.ok(Array.isArray(goalsRes.body.data), 'Goals list should be an array');
    assert.ok(goalsRes.body.data.length >= 1, 'Goals list should have at least 1 goal');
    assert.ok(goalsRes.body.data[0].monthlySavingsRequired > 0, 'Should compute monthly savings required');
    assert.ok(goalsRes.body.data[0].probability > 0, 'Should compute goal probability');

    // 5. Trip Planner
    console.log('Testing POST /trip-planner endpoint...');
    const tripRes = await makeRequest('POST', '/trip-planner', authHeaders, {
      destination: 'Bali',
      numberOfTravelers: 2,
      startDate: '2026-08-01',
      endDate: '2026-08-10',
      budget: 150000
    });
    assert.strictEqual(tripRes.statusCode, 200);
    assert.strictEqual(tripRes.body.status, 'success');
    assert.ok(tripRes.body.data.estimatedCost > 0);
    assert.ok(tripRes.body.data.recommendation);
    assert.ok(Array.isArray(tripRes.body.data.affordableOptions));

    // 6. Debt Assessment
    console.log('Testing POST /debt-analysis endpoint...');
    const debtRes = await makeRequest('POST', '/debt-analysis', authHeaders, {
      totalDebt: 300000,
      emiAmount: 15000
    });
    assert.strictEqual(debtRes.statusCode, 200);
    assert.strictEqual(debtRes.body.status, 'success');
    assert.ok(debtRes.body.data.debtRiskScore >= 0);
    assert.ok(debtRes.body.data.category);
    assert.ok(debtRes.body.data.repaymentPlan);

    // 7. Analyze Subscriptions
    console.log('Testing GET /subscriptions/analyze endpoint...');
    const subRes = await makeRequest('GET', '/subscriptions/analyze', authHeaders);
    assert.strictEqual(subRes.statusCode, 200);
    assert.strictEqual(subRes.body.status, 'success');
    assert.ok(Array.isArray(subRes.body.data.subscriptions));
    assert.ok(subRes.body.data.monthlySubscriptionCost >= 0);

    // 8. Recommendations
    console.log('Testing GET /recommendations endpoint...');
    const recRes = await makeRequest('GET', '/recommendations', authHeaders);
    assert.strictEqual(recRes.statusCode, 200);
    assert.strictEqual(recRes.body.status, 'success');
    assert.ok(Array.isArray(recRes.body.data.recommendations));
    assert.ok(recRes.body.data.recommendations.length > 0);

    // 9. Notifications
    console.log('Testing GET /notifications endpoint...');
    const notifRes = await makeRequest('GET', '/notifications', authHeaders);
    assert.strictEqual(notifRes.statusCode, 200);
    assert.strictEqual(notifRes.body.status, 'success');
    assert.ok(Array.isArray(notifRes.body.data));

    console.log('\n=============================================');
    console.log('ALL INTEGRATION TESTS PASSED SUCCESSFULLY! (9/9)');
    console.log('=============================================\n');

    // Clean up database test records
    console.log('Connecting database for cleanup...');
    await mongoose.connect(MONGO_URI);
    await User.findByIdAndDelete(userId);
    await Goal.deleteMany({ userId });
    await Trip.deleteMany({ userId });
    await DebtAnalysis.deleteMany({ userId });
    await mongoose.disconnect();
    console.log('Test database cleanup complete. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('\n!!! TEST ASSERTION FAILED !!!');
    console.error(err);
    process.exit(1);
  }
};

// Check if server is running
const checkServerAndRun = () => {
  const req = http.request({ method: 'GET', hostname: 'localhost', port: PORT, path: '/' }, (res) => {
    runTests();
  });
  req.on('error', (err) => {
    console.log(`Error: Express server is not running on port ${PORT}. Please start the server using "npm run dev" or "node server.js" first.`);
    process.exit(1);
  });
  req.end();
};

checkServerAndRun();
