const mongoose = require('mongoose');
const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper: Make HTTP request to Express server
const makeRequest = (method, endpoint, headers = {}, body = null, isMultipart = false, multipartBuffer = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
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

    if (isMultipart) {
      delete options.headers['Content-Type'];
      options.headers['Content-Type'] = headers['Content-Type'];
      options.headers['Content-Length'] = multipartBuffer.length;
    }

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

    if (isMultipart && multipartBuffer) {
      req.write(multipartBuffer);
    } else if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('Starting Universal Bank Statement Parser Integration Tests...');
  const randomEmail = `test_parser_${Math.floor(Math.random() * 100000)}@test.com`;
  let token = '';
  const authHeaders = {};

  try {
    // 1. Register test user
    console.log('Registering test user...');
    const regRes = await makeRequest('POST', '/auth/register', {}, {
      name: 'Parser Test User',
      email: randomEmail,
      password: 'testpassword123',
      age: 30,
      monthlyIncome: 95000
    });

    assert.strictEqual(regRes.statusCode, 201, 'Register status code should be 201');
    token = regRes.body.token;
    authHeaders['Authorization'] = `Bearer ${token}`;
    console.log('User registered successfully.');

    // 2. Upload SBI Statement (CSV)
    console.log('Uploading SBI statement (CSV)...');
    const sbiCsvPath = path.join(__dirname, '../ai-engine/data/sample_statements/sbi_statement.csv');
    if (!fs.existsSync(sbiCsvPath)) {
      throw new Error(`Sample file not found at ${sbiCsvPath}. Run generate_statement_data.py first.`);
    }
    
    const fileContent = fs.readFileSync(sbiCsvPath);
    const boundary = '----WebKitFormBoundaryStatementTest';
    const header = `--${boundary}\r\n` +
                   `Content-Disposition: form-data; name="statement"; filename="sbi_statement.csv"\r\n` +
                   `Content-Type: text/csv\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const multipartBuffer = Buffer.concat([
      Buffer.from(header, 'utf8'),
      fileContent,
      Buffer.from(footer, 'utf8')
    ]);

    const uploadRes = await makeRequest('POST', '/upload-statement', {
      ...authHeaders,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    }, null, true, multipartBuffer);

    assert.strictEqual(uploadRes.statusCode, 201, 'Upload should return 201 Created');
    assert.strictEqual(uploadRes.body.status, 'success', 'Upload status should be success');
    assert.ok(uploadRes.body.data.total_transactions > 0, 'Transactions parsed should be > 0');
    console.log(`Successfully uploaded statement: detected bank ${uploadRes.body.data.detected_bank}`);

    // 3. Fetch Transactions
    console.log('Fetching transactions...');
    const txRes = await makeRequest('GET', '/transactions', authHeaders);
    assert.strictEqual(txRes.statusCode, 200);
    assert.ok(txRes.body.data.length > 0, 'Transactions list should not be empty');
    console.log(`Fetched ${txRes.body.data.length} normalized transactions.`);

    // Find an unknown or low confidence transaction to correct
    const targetTx = txRes.body.data.find(t => t.is_unknown || t.confidence < 0.7) || txRes.body.data[0];
    
    // 4. Update Category
    console.log(`Correcting category for transaction ID: ${targetTx._id}...`);
    const updateRes = await makeRequest('POST', '/update-category', authHeaders, {
      transactionId: targetTx._id,
      correctedCategory: 'Food',
      merchantName: 'Zomato Correction'
    });

    assert.strictEqual(updateRes.statusCode, 200);
    console.log('Category updated successfully.');

    // 5. Fetch Subscriptions
    console.log('Fetching subscriptions...');
    const subRes = await makeRequest('GET', '/subscriptions', authHeaders);
    assert.strictEqual(subRes.statusCode, 200);
    console.log(`Fetched ${subRes.body.data.length} active subscriptions.`);

    // 6. Fetch Merchant Analysis
    console.log('Fetching merchant analysis...');
    const analRes = await makeRequest('GET', '/merchant-analysis', authHeaders);
    assert.strictEqual(analRes.statusCode, 200);
    assert.ok(analRes.body.data.total_expenses >= 0);
    console.log('Merchant analysis charts and stats fetched successfully.');

    console.log('ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('INTEGRATION TEST FAILED:', err.message);
    process.exit(1);
  }
};

runTests();
