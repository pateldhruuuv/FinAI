const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- FinPilot AI Settings Integration Tests ---');
  let token = '';
  let testUserId = '';
  let linkedAccountId = '';

  const testUser = {
    name: 'Settings Test User',
    email: `settingstest_${Date.now()}@example.com`,
    password: 'securepassword123',
    age: 28,
    monthlyIncome: 65000,
  };

  // 1. Register test user
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const regData = await regRes.json();
    if (regRes.ok && regData.token) {
      token = regData.token;
      testUserId = regData.user.id;
      console.log('✅ 1. Registration successful. User ID:', testUserId);
    } else {
      console.error('❌ 1. Registration returned error:', regData);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ 1. Registration failed:', err.message);
    process.exit(1);
  }

  // Setup headers for all subsequent requests
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch initial profile
  try {
    const profRes = await fetch(`${BASE_URL}/profile`, { headers });
    const profData = await profRes.json();
    if (profRes.ok && profData.status === 'success' && profData.profileCompletion !== undefined) {
      console.log('✅ 2. Fetch profile details successful. Completion %:', profData.profileCompletion);
    } else {
      console.error('❌ 2. Fetch profile returned invalid response:', profData);
    }
  } catch (err) {
    console.error('❌ 2. Fetch profile failed:', err.message);
  }

  // 3. Update personal profile (triggers age calculations)
  try {
    const updateRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        phone: '+91 9876543210',
        dob: '1998-05-15', // should make age 28
        gender: 'Male',
        address: '101 Prime St',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        occupation: 'Architect',
      })
    });
    const updateData = await updateRes.json();
    if (updateRes.ok && updateData.status === 'success' && updateData.user.age === 28) {
      console.log('✅ 3. Profile update with DOB and age recalculation successful. Age:', updateData.user.age);
    } else {
      console.error('❌ 3. Profile update response mismatch:', updateData);
    }
  } catch (err) {
    console.error('❌ 3. Profile update failed:', err.message);
  }

  // 4. Update financial profile (triggers FastAPI background calculations)
  try {
    const finRes = await fetch(`${BASE_URL}/financial-profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        monthlyIncome: 80000,
        monthlyExpenses: 40000,
        savings: 200000,
        emergencyFund: 120000,
        riskProfile: 'Aggressive',
        investmentExperience: 'Intermediate',
        investmentGoal: 'Wealth creation',
        retirementAge: 55,
        dependents: 1
      })
    });
    const finData = await finRes.json();
    if (finRes.ok && finData.status === 'success' && finData.user.riskProfile === 'Aggressive') {
      console.log('✅ 4. Financial profile update successful.');
    } else {
      console.error('❌ 4. Financial profile update response mismatch:', finData);
    }
  } catch (err) {
    console.error('❌ 4. Financial profile update failed:', err.message);
  }

  // 5. Update preferences
  try {
    const prefRes = await fetch(`${BASE_URL}/preferences`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        theme: 'light',
        currency: 'USD',
        language: 'es',
      })
    });
    const prefData = await prefRes.json();
    if (prefRes.ok && prefData.status === 'success' && prefData.user.currency === 'USD') {
      console.log('✅ 5. User preferences update successful.');
    } else {
      console.error('❌ 5. Preferences update response mismatch:', prefData);
    }
  } catch (err) {
    console.error('❌ 5. Preferences update failed:', err.message);
  }

  // 6. Update notifications
  try {
    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        email: false,
        sms: false,
        marketNews: false,
      })
    });
    const notifData = await notifRes.json();
    if (notifRes.ok && notifData.status === 'success' && notifData.user.notifications.email === false) {
      console.log('✅ 6. Notifications configuration update successful.');
    } else {
      console.error('❌ 6. Notifications update response mismatch:', notifData);
    }
  } catch (err) {
    console.error('❌ 6. Notifications update failed:', err.message);
  }

  // 7. Change password
  try {
    const passRes = await fetch(`${BASE_URL}/security/change-password`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        oldPassword: testUser.password,
        newPassword: 'newsecurepassword789',
      })
    });
    const passData = await passRes.json();
    if (passRes.ok && passData.status === 'success') {
      console.log('✅ 7. Password change successful.');
    } else {
      console.error('❌ 7. Password change response mismatch:', passData);
    }
  } catch (err) {
    console.error('❌ 7. Password change failed:', err.message);
  }

  // 8. Connect a linked account
  try {
    const linkRes = await fetch(`${BASE_URL}/linked-accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountType: 'bank',
        institutionName: 'HDFC Bank Ltd',
        accountNumber: '120933994488',
        balance: 45000,
      })
    });
    const linkData = await linkRes.json();
    if (linkRes.ok && linkData.status === 'success' && linkData.account._id) {
      linkedAccountId = linkData.account._id;
      console.log('✅ 8. Linking account successful. Account ID:', linkedAccountId);
    } else {
      console.error('❌ 8. Link account response mismatch:', linkData);
    }
  } catch (err) {
    console.error('❌ 8. Linking account failed:', err.message);
  }

  // 9. Fetch linked accounts list
  try {
    const listRes = await fetch(`${BASE_URL}/linked-accounts`, { headers });
    const listData = await listRes.json();
    if (listRes.ok && listData.status === 'success' && listData.accounts.length === 1) {
      console.log('✅ 9. Linked accounts retrieval successful.');
    } else {
      console.error('❌ 9. Linked accounts retrieval mismatch:', listData);
    }
  } catch (err) {
    console.error('❌ 9. Linked accounts retrieval failed:', err.message);
  }

  // 10. Generate PDF report
  try {
    const reportRes = await fetch(`${BASE_URL}/settings/reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        reportType: 'Health',
        format: 'PDF'
      })
    });

    if (reportRes.ok && reportRes.headers.get('content-type') === 'application/pdf') {
      const buffer = await reportRes.arrayBuffer();
      console.log('✅ 10. PDF Report compilation successful. Bytes:', buffer.byteLength);
    } else {
      console.error('❌ 10. PDF Report response mismatch:', reportRes.status, reportRes.headers.get('content-type'));
    }
  } catch (err) {
    console.error('❌ 10. PDF Report compilation failed:', err.message);
  }

  // 11. Delete linked account
  try {
    const unlinkRes = await fetch(`${BASE_URL}/linked-accounts/${linkedAccountId}`, {
      method: 'DELETE',
      headers
    });
    const unlinkData = await unlinkRes.json();
    if (unlinkRes.ok && unlinkData.status === 'success') {
      console.log('✅ 11. Unlinking account successful.');
    } else {
      console.error('❌ 11. Unlink account response mismatch:', unlinkData);
    }
  } catch (err) {
    console.error('❌ 11. Unlinking account failed:', err.message);
  }

  // 12. Deleting account (cascade wipe)
  try {
    const deleteRes = await fetch(`${BASE_URL}/account`, {
      method: 'DELETE',
      headers
    });
    const deleteData = await deleteRes.json();
    if (deleteRes.ok && deleteData.status === 'success') {
      console.log('✅ 12. User account deletion cascade successful.');
    } else {
      console.error('❌ 12. Account deletion response mismatch:', deleteData);
    }
  } catch (err) {
    console.error('❌ 12. User account deletion failed:', err.message);
  }

  console.log('--- Integration Testing Completed ---');
}

runTests();
