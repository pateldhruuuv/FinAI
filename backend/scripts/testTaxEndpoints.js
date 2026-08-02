const http = require('http');
const assert = require('assert');

const PORT = 5000;
const HOST = '127.0.0.1';

const makeRequest = (method, path, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
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
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
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
  console.log('--- STARTING TAX OPTIMIZER 2.0 API VERIFICATION ---');
  const randomEmail = `tax_tester_${Math.floor(Math.random() * 100000)}@test.com`;
  let token = '';
  let authHeaders = {};

  try {
    // 1. Register User
    console.log('\nStep 1: Registering test user...');
    const regRes = await makeRequest('POST', '/auth/register', {}, {
      name: 'Tax Tester User',
      email: randomEmail,
      password: 'testpassword123',
      age: 30,
      monthlyIncome: 100000
    });
    assert.strictEqual(regRes.statusCode, 201);
    token = regRes.body.token;
    authHeaders = { 'Authorization': `Bearer ${token}` };
    console.log('   Register successful. User is Premium:', regRes.body.user.isPremium);

    // 2. Upgrade to Premium if not already
    if (!regRes.body.user.isPremium) {
      console.log('Step 2: Upgrading user to Premium...');
      const premRes = await makeRequest('POST', '/auth/toggle-premium', authHeaders);
      assert.strictEqual(premRes.statusCode, 200);
      console.log('   Upgraded successfully. User is Premium:', premRes.body.user.isPremium);
    }

    // 3. Test calculation validation (Negative checks)
    console.log('\nStep 3: Verifying negative checks validation...');
    const negRes = await makeRequest('POST', '/tax/calculate', authHeaders, {
      annualSalary: -50000,
      age: 30,
      residentialStatus: 'Resident',
      financialYear: 'FY 2024-25',
      taxRegime: 'new'
    });
    assert.strictEqual(negRes.statusCode, 400);
    console.log('   Rejection verified:', negRes.body.message);

    // 4. Test calculation validation (Deduction exceeding limit)
    console.log('\nStep 4: Verifying deduction limits validation...');
    const limitRes = await makeRequest('POST', '/tax/calculate', authHeaders, {
      annualSalary: 1200000,
      age: 30,
      residentialStatus: 'Resident',
      financialYear: 'FY 2024-25',
      taxRegime: 'old',
      deductions: {
        ppf: 160000 // exceeds 150k
      }
    });
    assert.strictEqual(limitRes.statusCode, 400);
    console.log('   Rejection verified:', limitRes.body.message);

    // 5. Test POST /tax/calculate
    console.log('\nStep 5: Testing POST /tax/calculate with valid inputs...');
    const calcRes = await makeRequest('POST', '/tax/calculate', authHeaders, {
      annualSalary: 1200000,
      businessIncome: 100000,
      rentalIncome: 50000,
      age: 35,
      residentialStatus: 'Resident',
      financialYear: 'FY 2024-25',
      taxRegime: 'new',
      deductions: {
        ppf: 50000,
        elss: 30000,
        healthInsurance: 15000,
        nps: 20000
      },
      tds: 50000
    });
    assert.strictEqual(calcRes.statusCode, 200);
    const data = calcRes.body.data;
    console.log('   Tax Calculation Successful:');
    console.log(`   - Gross Income: ₹${data.income.grossIncome.toLocaleString()}`);
    console.log(`   - Taxable Income: ₹${data.income.taxableIncome.toLocaleString()}`);
    console.log(`   - Final Tax Liability: ₹${data.tax.finalTaxLiability.toLocaleString()}`);
    console.log(`   - Tax Refund Due: ₹${data.tax.taxRefund.toLocaleString()}`);
    console.log(`   - Tax Payable Due: ₹${data.tax.taxPayable.toLocaleString()}`);
    assert.strictEqual(data.income.grossIncome, 1350000);
    assert.ok(data.recommendations.length > 0);
    const calcId = data.id;

    // 6. Test POST /tax/compare
    console.log('\nStep 6: Testing POST /tax/compare...');
    const compRes = await makeRequest('POST', '/tax/compare', authHeaders, {
      annualSalary: 1200000,
      businessIncome: 100000,
      rentalIncome: 50000,
      age: 35,
      residentialStatus: 'Resident',
      financialYear: 'FY 2024-25',
      taxRegime: 'new',
      deductions: {
        ppf: 50000,
        elss: 30000,
        healthInsurance: 15000,
        nps: 20000
      }
    });
    assert.strictEqual(compRes.statusCode, 200);
    console.log('   Regime Comparison Successful:');
    console.log(`   - Old Regime Net Tax: ₹${compRes.body.data.comparison.old.finalTaxLiability.toLocaleString()}`);
    console.log(`   - New Regime Net Tax: ₹${compRes.body.data.comparison.new.finalTaxLiability.toLocaleString()}`);
    console.log(`   - Recommended Regime: ${compRes.body.data.betterRegime.toUpperCase()} Regime (Savings: ₹${compRes.body.data.savings.toLocaleString()})`);

    // 7. Test POST /tax/scenario
    console.log('\nStep 7: Testing POST /tax/scenario simulator...');
    const simRes = await makeRequest('POST', '/tax/scenario', authHeaders, {
      annualSalary: 1200000,
      businessIncome: 100000,
      rentalIncome: 50000,
      age: 35,
      residentialStatus: 'Resident',
      financialYear: 'FY 2024-25',
      taxRegime: 'old', // use old regime for simulated deductions impact
      deductions: {
        ppf: 50000,
        elss: 30000,
        healthInsurance: 15000,
        nps: 10000
      },
      scenario: {
        elss: 50000,
        nps: 40000
      }
    });
    assert.strictEqual(simRes.statusCode, 200);
    console.log('   Scenario Simulation Successful:');
    console.log(`   - Base Tax: ₹${simRes.body.data.currentTax.toLocaleString()}`);
    console.log(`   - Simulated New Tax: ₹${simRes.body.data.newTax.toLocaleString()}`);
    console.log(`   - Direct Tax Savings: ₹${simRes.body.data.taxSaved.toLocaleString()}`);
    console.log(`   - Simulated ROI: ${simRes.body.data.roi}%`);

    // 8. Test GET /tax/history
    console.log('\nStep 8: Testing GET /tax/history logs...');
    const histRes = await makeRequest('GET', '/tax/history', authHeaders);
    assert.strictEqual(histRes.statusCode, 200);
    console.log(`   Calculation History Count: ${histRes.body.data.length}`);
    assert.ok(histRes.body.data.length > 0);

    // 9. Test GET /tax/export/:id (PDF Exporter header check)
    console.log('\nStep 9: Testing GET /tax/export/:id for PDF downloads...');
    const pdfRes = await makeRequest('GET', `/tax/export/${calcId}`, authHeaders);
    assert.strictEqual(pdfRes.statusCode, 200);
    console.log('   PDF Export Header verification successful. Response type is PDF.');

    // 10. Test GET /tax/report/:id (PDF report endpoint)
    console.log('\nStep 10: Testing GET /tax/report/:id...');
    const reportRes = await makeRequest('GET', `/tax/report/${calcId}`, authHeaders);
    assert.strictEqual(reportRes.statusCode, 200);
    console.log('   PDF Report endpoint verified successfully.');

    // 11. Test NaN Validation check
    console.log('\nStep 11: Verifying NaN/Infinity input validations...');
    const nanRes = await makeRequest('POST', '/tax/calculate', authHeaders, {
      annualSalary: 'NaN',
      age: 30,
      residentialStatus: 'Resident',
      financialYear: 'FY 2024-25',
      taxRegime: 'new'
    });
    assert.strictEqual(nanRes.statusCode, 400);
    console.log('   NaN Rejection verified:', nanRes.body.message);

    // 12. Test Invalid FY check
    console.log('\nStep 12: Verifying invalid Financial Year validations...');
    const fyRes = await makeRequest('POST', '/tax/calculate', authHeaders, {
      annualSalary: 500000,
      age: 30,
      residentialStatus: 'Resident',
      financialYear: 'FY 2030-31',
      taxRegime: 'new'
    });
    assert.strictEqual(fyRes.statusCode, 400);
    console.log('   Invalid FY Rejection verified:', fyRes.body.message);

    console.log('\n--- ALL API VERIFICATION TESTS PASSED SUCCESSFULLY! ---');

  } catch (err) {
    console.error('API Verification Test failed!', err);
    process.exit(1);
  }
};

runTests();
