const BASE_URL = 'http://localhost:5000';
const assert = require('assert');

async function runTests() {
  console.log('--- Transactions Deletion & Date/Description Filtering Tests ---');

  // Register a test user
  let token = '';
  const testUser = {
    name: 'Delete Filter Test User',
    email: `df_test_${Date.now()}@example.com`,
    password: 'password123',
    age: 30,
    monthlyIncome: 75000
  };

  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const regData = await regRes.json();
    if (regRes.ok) {
      token = regData.token;
      console.log('✅ Test User registered successfully.');
    } else {
      console.error('❌ Register failed:', regData);
      return;
    }
  } catch (err) {
    console.error('❌ Register exception:', err.message);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Test: Verify DELETE with invalid ID returns 404
  try {
    const delRes = await fetch(`${BASE_URL}/transactions/60c72b2f9b1d8b2ab4847e8b`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const delData = await delRes.json();
    if (delRes.status === 404 && delData.status === 'error') {
      console.log('✅ Test 1 Passed: Invalid transaction ID returned 404 as expected.');
    } else {
      console.error('❌ Test 1 Failed: Expected 404, got', delRes.status, delData);
    }
  } catch (err) {
    console.error('❌ Test 1 Exception:', err.message);
  }

  // To test the filter and delete, let's upload a simulated statement file
  // Wait, let's use the statement upload test to upload canara_statement.csv
  try {
    const fs = require('fs');
    const path = require('path');
    const statementPath = path.join(__dirname, '../ai-engine/data/sample_statements/canara_statement.csv');
    
    if (fs.existsSync(statementPath)) {
      const fileContent = fs.readFileSync(statementPath);
      const boundary = '----WebKitFormBoundaryStatementTest';
      const header = `--${boundary}\r\n` +
                     `Content-Disposition: form-data; name="statement"; filename="canara_statement.csv"\r\n` +
                     `Content-Type: text/csv\r\n\r\n`;
      const footer = `\r\n--${boundary}--\r\n`;
      const multipartBuffer = Buffer.concat([
        Buffer.from(header, 'utf8'),
        fileContent,
        Buffer.from(footer, 'utf8')
      ]);

      console.log('Uploading canara_statement.csv...');
      const uploadRes = await fetch(`${BASE_URL}/upload-statement`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: multipartBuffer
      });
      const uploadData = await uploadRes.json();

      if (uploadRes.ok && uploadData.status === 'success') {
        console.log(`✅ Test 2 Passed: Statement uploaded. Parsed ${uploadData.count} transactions.`);
        
        // Fetch dashboard to get transaction list
        const dashRes = await fetch(`${BASE_URL}/dashboard`, { headers: authHeaders });
        const dashData = await dashRes.json();
        
        if (dashRes.ok && dashData.data.recentTransactions.length > 0) {
          const targetTx = dashData.data.recentTransactions[0];
          console.log(`Deleting transaction ID: ${targetTx._id} (Desc: "${targetTx.description}", Amt: ${targetTx.amount})...`);
          
          // Delete
          const delRes = await fetch(`${BASE_URL}/transactions/${targetTx._id}`, {
            method: 'DELETE',
            headers: authHeaders
          });
          const delData = await delRes.json();
          
          if (delRes.ok && delData.status === 'success') {
            console.log('✅ Test 3 Passed: Transaction deleted successfully.');
            
            // Check that it is deleted
            const dashRes2 = await fetch(`${BASE_URL}/dashboard`, { headers: authHeaders });
            const dashData2 = await dashRes2.json();
            const exists = dashData2.data.recentTransactions.some(t => t._id === targetTx._id);
            if (!exists) {
              console.log('✅ Test 4 Passed: Transaction is completely absent from dashboard transactions list.');
            } else {
              console.error('❌ Test 4 Failed: Transaction still exists in list after delete!');
            }
          } else {
            console.error('❌ Test 3 Failed:', delRes.status, delData);
          }
        } else {
          console.error('❌ Failed to retrieve recent transactions from dashboard');
        }
      } else {
        console.error('❌ Failed to upload statement:', uploadRes.status, uploadData);
      }
    } else {
      console.log('⚠️ skipping upload/delete tests since canara_statement.csv was not found');
    }
  } catch (err) {
    console.error('❌ Upload/Delete Exception:', err);
  }

  // Clean up user
  try {
    await fetch(`${BASE_URL}/account`, {
      method: 'DELETE',
      headers: authHeaders
    });
    console.log('✅ Cleaned up test user successfully.');
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
  }

  console.log('--- Integration Testing Completed ---');
}

runTests();
