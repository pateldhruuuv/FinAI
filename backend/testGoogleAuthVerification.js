const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Google Authentication Verification Tests ---');

  // Test 1: POST /auth/google with invalid/empty token
  try {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: '' })
    });
    const data = await res.json();
    if (res.status === 400 && data.status === 'error') {
      console.log('✅ Test 1 Passed: Empty token rejected with 400 Bad Request.');
    } else {
      console.error('❌ Test 1 Failed: Expected 400, got', res.status, data);
    }
  } catch (err) {
    console.error('❌ Test 1 Exception:', err.message);
  }

  // Test 2: POST /auth/google with malformed JWT token
  try {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid.token.format' })
    });
    const data = await res.json();
    if (res.status === 401 && data.message.includes('Invalid or expired')) {
      console.log('✅ Test 2 Passed: Invalid Google ID token rejected with 401.');
    } else {
      console.error('❌ Test 2 Failed: Expected 401, got', res.status, data);
    }
  } catch (err) {
    console.error('❌ Test 2 Exception:', err.message);
  }

  // Test 3: POST /auth/google with malformed Access token
  try {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'ya29.invalid_access_token' })
    });
    const data = await res.json();
    if (res.status === 401 && data.message.includes('Invalid or expired')) {
      console.log('✅ Test 3 Passed: Invalid Access token rejected with 401.');
    } else {
      console.error('❌ Test 3 Failed: Expected 401, got', res.status, data);
    }
  } catch (err) {
    console.error('❌ Test 3 Exception:', err.message);
  }

  // Test 4: Setup a user to verify /auth/me and /auth/logout
  let token = '';
  const testUser = {
    name: 'OAuth Me Test',
    email: `oauthme_${Date.now()}@example.com`,
    password: 'password123',
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
      console.log('✅ Test User registered. Token obtained.');
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

  // Test 5: GET /auth/me
  try {
    const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    if (meRes.ok && meData.status === 'success' && meData.user.email === testUser.email) {
      console.log('✅ Test 5 Passed: GET /auth/me successfully returned user details.');
    } else {
      console.error('❌ Test 5 Failed:', meRes.status, meData);
    }
  } catch (err) {
    console.error('❌ Test 5 Exception:', err.message);
  }

  // Test 6: POST /auth/logout
  try {
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: authHeaders
    });
    const logoutData = await logoutRes.json();
    if (logoutRes.ok && logoutData.status === 'success') {
      console.log('✅ Test 6 Passed: POST /auth/logout completed successfully.');
    } else {
      console.error('❌ Test 6 Failed:', logoutRes.status, logoutData);
    }
  } catch (err) {
    console.error('❌ Test 6 Exception:', err.message);
  }

  // Clean up user
  try {
    await fetch(`${BASE_URL}/account`, {
      method: 'DELETE',
      headers: authHeaders
    });
    console.log('✅ Cleaned up test user.');
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
  }

  console.log('--- Google Auth Integration Testing Completed ---');
}

runTests();
