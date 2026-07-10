const mongoose = require('mongoose');
const assert = require('assert');
const http = require('http');

const User = require('./models/User');
const TaxAnalysis = require('./models/TaxAnalysis');
const Loans = require('./models/Loans');
const PurchaseHistory = require('./models/PurchaseHistory');
const Portfolio = require('./models/Portfolio');
const Reports = require('./models/Reports');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finpilot';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

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
  console.log('Frying up Phase 3 Premium Integration Tests...');
  const randomEmail = `premium_tester_${Math.floor(Math.random() * 100000)}@test.com`;
  let token = '';
  let userId = '';

  try {
    // 1. Register test user (starts as Free)
    console.log('1. Registering test user (Free tier default)...');
    const regRes = await makeRequest('POST', '/auth/register', {}, {
      name: 'Premium Tester User',
      email: randomEmail,
      password: 'testpassword123',
      age: 30,
      monthlyIncome: 95000
    });

    assert.strictEqual(regRes.statusCode, 201);
    assert.strictEqual(regRes.body.status, 'success');
    assert.strictEqual(regRes.body.user.isPremium, false, 'User must start on Free tier');
    token = regRes.body.token;
    userId = regRes.body.user.id;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // 2. Test Premium Access Control (Free user blocked)
    console.log('2. Verifying Premium Access Control blocks free users...');
    const dashRes = await makeRequest('GET', '/premium-dashboard', authHeaders);
    assert.strictEqual(dashRes.statusCode, 403, 'Free user should get 403 Forbidden');
    assert.strictEqual(dashRes.body.status, 'error');
    assert.ok(dashRes.body.message.includes('Premium access required'));

    // 3. Upgrade user to Premium
    console.log('3. Elevating user status to Premium...');
    const upgradeRes = await makeRequest('POST', '/auth/toggle-premium', authHeaders);
    assert.strictEqual(upgradeRes.statusCode, 200);
    assert.strictEqual(upgradeRes.body.status, 'success');
    assert.strictEqual(upgradeRes.body.user.isPremium, true, 'User should be upgraded to Premium');

    // 4. Test Tax Optimizer
    console.log('4. Testing POST /tax-optimizer...');
    const taxRes = await makeRequest('POST', '/tax-optimizer', authHeaders, {
      annualIncome: 1200000,
      salaryStructure: { basic: 540000, hra: 180000 },
      deductions80C: 150000,
      deductions80D: 25000,
      homeLoan: 0,
      educationLoan: 0,
      rentPaid: 144000
    });
    assert.strictEqual(taxRes.statusCode, 200);
    assert.strictEqual(taxRes.body.status, 'success');
    assert.ok(taxRes.body.data.taxableIncome > 0);
    assert.ok(taxRes.body.data.taxBreakdownChart);

    // 5. Test Loan Advisor
    console.log('5. Testing POST /loan-advisor...');
    const loanRes = await makeRequest('POST', '/loan-advisor', authHeaders, {
      income: 100000,
      age: 30,
      creditScore: 780,
      currentEmi: 10000,
      existingLoans: 200000
    });
    assert.strictEqual(loanRes.statusCode, 200);
    assert.strictEqual(loanRes.body.status, 'success');
    assert.ok(loanRes.body.data.eligibleAmount > 0);
    assert.ok(loanRes.body.data.safeEmi > 0);

    // 6. Test Insurance Gap
    console.log('6. Testing POST /insurance-gap...');
    const insRes = await makeRequest('POST', '/insurance-gap', authHeaders, {
      coverageAmount: 1000000,
      dependents: 2,
      income: 1200000
    });
    assert.strictEqual(insRes.statusCode, 200);
    assert.strictEqual(insRes.body.status, 'success');
    assert.ok(insRes.body.data.coverageGap >= 0);

    // 7. Test Purchase Advisor
    console.log('7. Testing POST /purchase-advisor...');
    const purchaseRes = await makeRequest('POST', '/purchase-advisor', authHeaders, {
      item: 'Superbike',
      cost: 500000
    });
    assert.strictEqual(purchaseRes.statusCode, 200);
    assert.strictEqual(purchaseRes.body.status, 'success');
    assert.ok(purchaseRes.body.data.purchaseScore >= 0);

    // 8. Test What-If Simulator
    console.log('8. Testing POST /what-if...');
    const whatIfRes = await makeRequest('POST', '/what-if', authHeaders, {
      scenario: 'salary_increase',
      value: 15
    });
    assert.strictEqual(whatIfRes.statusCode, 200);
    assert.strictEqual(whatIfRes.body.status, 'success');
    assert.ok(whatIfRes.body.data.futureSavings > 0);

    // 9. Test Portfolio Risk
    console.log('9. Testing POST /portfolio-risk...');
    const portRes = await makeRequest('POST', '/portfolio-risk', authHeaders, {
      stocks: 200000,
      mutualFunds: 300000,
      gold: 50000,
      fd: 100000,
      crypto: 5000,
      property: 0
    });
    assert.strictEqual(portRes.statusCode, 200);
    assert.strictEqual(portRes.body.status, 'success');
    assert.ok(portRes.body.data.riskScore >= 0);
    assert.ok(portRes.body.data.portfolioChart);

    // 10. Test Financial Coach
    console.log('10. Testing POST /financial-coach...');
    const coachRes = await makeRequest('POST', '/financial-coach', authHeaders, {
      question: 'Should I invest now?'
    });
    if (coachRes.statusCode !== 200) {
      console.error("Coach response failed with body:", coachRes.body);
    }
    assert.strictEqual(coachRes.statusCode, 200);
    assert.strictEqual(coachRes.body.status, 'success');
    assert.ok(coachRes.body.reply);

    // 11. Test Reports (PDF)
    console.log('11. Testing POST /financial-report (PDF format)...');
    const pdfRes = await makeRequest('POST', '/financial-report', authHeaders, {
      reportType: 'Monthly',
      format: 'PDF'
    });
    assert.strictEqual(pdfRes.statusCode, 200);
    assert.strictEqual(pdfRes.headers['content-type'], 'application/pdf');

    // 12. Test Reports (CSV)
    console.log('12. Testing POST /financial-report (CSV format)...');
    const csvRes = await makeRequest('POST', '/financial-report', authHeaders, {
      reportType: 'Monthly',
      format: 'CSV'
    });
    assert.strictEqual(csvRes.statusCode, 200);
    assert.strictEqual(csvRes.headers['content-type'], 'text/csv; charset=utf-8');

    // 13. Test Premium Dashboard GET
    console.log('13. Testing GET /premium-dashboard (Unlocked)...');
    const finalDashRes = await makeRequest('GET', '/premium-dashboard', authHeaders);
    assert.strictEqual(finalDashRes.statusCode, 200);
    assert.strictEqual(finalDashRes.body.status, 'success');
    assert.ok(finalDashRes.body.data.netWorth !== undefined);
    assert.ok(finalDashRes.body.data.plots);

    console.log('\n=============================================');
    console.log('ALL PHASE 3 PREMIUM API TESTS PASSED! (13/13)');
    console.log('=============================================\n');

    // Cleanup
    console.log('Connecting database for cleanup...');
    await mongoose.connect(MONGO_URI);
    await User.findByIdAndDelete(userId);
    await TaxAnalysis.deleteMany({ userId });
    await Loans.deleteMany({ userId });
    await PurchaseHistory.deleteMany({ userId });
    await Portfolio.deleteMany({ userId });
    await Reports.deleteMany({ userId });
    await mongoose.disconnect();
    console.log('Test database cleanup complete. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('\n!!! PREMIUM ADVISORY TEST ASSERTION FAILED !!!');
    console.error(err);
    process.exit(1);
  }
};

const checkServerAndRun = () => {
  const req = http.request({ method: 'GET', hostname: 'localhost', port: PORT, path: '/' }, (res) => {
    runTests();
  });
  req.on('error', () => {
    console.log(`Error: Express server is not running on port ${PORT}. Please start the server using "npm run dev" or "node server.js" first.`);
    process.exit(1);
  });
  req.end();
};

checkServerAndRun();
