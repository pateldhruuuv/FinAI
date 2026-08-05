const BASE_URL = 'http://localhost:5000';
const assert = require('assert');

async function runTests() {
  console.log('--- Upgraded AI Chatbot Pipeline Tests ---');

  // Register a test user (starts as Free Tier by default)
  let token = '';
  let userId = '';
  const testUser = {
    name: 'Chatbot Upgrade Test User',
    email: `cb_test_${Date.now()}@example.com`,
    password: 'password123',
    age: 35,
    monthlyIncome: 80000
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

  // Test 1: Out of Scope query triggers fallback
  try {
    console.log('Testing out of scope question: "who is the president?"...');
    const chatRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ message: 'who is the president?' })
    });
    const chatData = await chatRes.json();
    
    assert.strictEqual(chatRes.status, 200);
    const content = chatData.aiMessage.content;
    assert.ok(content.includes('I can assist only with financial planning and the features available within FinPilot AI.'));
    console.log('✅ Test 1 Passed: Out-of-scope query returned exact fallback message.');
  } catch (err) {
    console.error('❌ Test 1 Failed:', err.message);
  }

  // Test 2: Premium features on Free tier explains benefits without calculations
  try {
    console.log('Testing premium feature (tax optimizer) on Free Tier: "Optimize my taxes"...');
    // Note: We create a new chat for tax
    const chatRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ message: 'Optimize my taxes' })
    });
    const chatData = await chatRes.json();
    
    assert.strictEqual(chatRes.status, 200);
    const content = chatData.aiMessage.content;
    // Should recommend upgrading and detail benefits
    assert.ok(content.toLowerCase().includes('premium') || content.toLowerCase().includes('upgrade'));
    // Should contain suggestion chips matching tax intent
    const suggestions = chatData.aiMessage.metadata?.suggestions || [];
    assert.ok(suggestions.length === 3);
    assert.ok(suggestions.some(s => s.toLowerCase().includes('tax') || s.toLowerCase().includes('hra')));
    console.log('✅ Test 2 Passed: Premium query on Free tier restricted details and returned suggestions:', suggestions);
  } catch (err) {
    console.error('❌ Test 2 Failed:', err.message);
  }

  // Test 3: Standard Free Tier feature: "Show my health score"
  try {
    console.log('Testing free feature (health score): "What is my health score?"...');
    const chatRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ message: 'What is my health score?' })
    });
    const chatData = await chatRes.json();
    
    assert.strictEqual(chatRes.status, 200);
    const content = chatData.aiMessage.content;
    const suggestions = chatData.aiMessage.metadata?.suggestions || [];
    assert.ok(suggestions.length === 3);
    assert.ok(suggestions.some(s => s.toLowerCase().includes('health') || s.toLowerCase().includes('score') || s.toLowerCase().includes('savings')));
    console.log('✅ Test 3 Passed: Free query returned health analytics suggestions:', suggestions);
  } catch (err) {
    console.error('❌ Test 3 Failed:', err.message);
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

  console.log('--- Upgraded Chatbot Testing Completed ---');
}

runTests();
