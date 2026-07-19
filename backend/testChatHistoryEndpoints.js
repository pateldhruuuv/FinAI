const mongoose = require('mongoose');
const assert = require('assert');
const http = require('http');

const User = require('./models/User');
const Conversation = require('./models/Conversation');
const ChatHistory = require('./models/ChatHistory');

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
  console.log('Starting Chat History API Integration Tests...');
  const randomEmail = `chat_test_${Math.floor(Math.random() * 100000)}@test.com`;
  let token = '';
  let userId = '';
  let firstChatId = '';
  let secondChatId = '';

  try {
    // 1. Register test user
    console.log('1. Testing auth/register...');
    const regRes = await makeRequest('POST', '/auth/register', {}, {
      name: 'Chat Test User',
      email: randomEmail,
      password: 'testpassword123',
      age: 30,
      monthlyIncome: 60000
    });

    assert.strictEqual(regRes.statusCode, 201);
    token = regRes.body.token;
    userId = regRes.body.user.id;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // 2. Start a blank chat
    console.log('2. Testing POST /api/chat (empty template)...');
    const emptyChatRes = await makeRequest('POST', '/api/chat', authHeaders, {});
    assert.strictEqual(emptyChatRes.statusCode, 200);
    assert.strictEqual(emptyChatRes.body.status, 'success');
    assert.ok(emptyChatRes.body.conversation.id);
    assert.strictEqual(emptyChatRes.body.conversation.title, 'New Chat');
    firstChatId = emptyChatRes.body.conversation.id;

    // 3. Rename the blank chat
    console.log('3. Testing PUT /api/chat/:chatId (rename conversation)...');
    const renameRes = await makeRequest('PUT', `/api/chat/${firstChatId}`, authHeaders, {
      title: 'Custom Financial Conversation'
    });
    assert.strictEqual(renameRes.statusCode, 200);
    assert.strictEqual(renameRes.body.status, 'success');
    assert.strictEqual(renameRes.body.conversation.title, 'Custom Financial Conversation');

    // 4. Send message to existing chat
    console.log('4. Testing POST /api/chat/:chatId/message (send message)...');
    const msgRes = await makeRequest('POST', `/api/chat/${firstChatId}/message`, authHeaders, {
      message: 'What insurance should I buy?'
    });
    assert.strictEqual(msgRes.statusCode, 200);
    assert.strictEqual(msgRes.body.status, 'success');
    assert.ok(msgRes.body.reply.content);
    assert.strictEqual(msgRes.body.reply.role, 'assistant');

    // 5. Start chat with initial query
    console.log('5. Testing POST /api/chat (chat with query)...');
    const newChatWithMsgRes = await makeRequest('POST', '/api/chat', authHeaders, {
      message: 'Should I invest in mutual funds?'
    });
    assert.strictEqual(newChatWithMsgRes.statusCode, 200);
    assert.strictEqual(newChatWithMsgRes.body.status, 'success');
    assert.ok(newChatWithMsgRes.body.conversation.id);
    assert.ok(newChatWithMsgRes.body.userMessage);
    assert.ok(newChatWithMsgRes.body.aiMessage);
    assert.ok(newChatWithMsgRes.body.conversation.title.startsWith('Should I invest in mutual funds'));
    secondChatId = newChatWithMsgRes.body.conversation.id;

    // 6. Get Chat History list
    console.log('6. Testing GET /api/chat/history (retrieve conversations)...');
    const historyRes = await makeRequest('GET', '/api/chat/history', authHeaders);
    assert.strictEqual(historyRes.statusCode, 200);
    assert.strictEqual(historyRes.body.status, 'success');
    assert.ok(Array.isArray(historyRes.body.data));
    assert.strictEqual(historyRes.body.data.length, 2);

    // 7. Test Search Filter
    console.log('7. Testing GET /api/chat/history?search=... (search filter)...');
    const searchRes = await makeRequest('GET', '/api/chat/history?search=mutual', authHeaders);
    assert.strictEqual(searchRes.statusCode, 200);
    assert.strictEqual(searchRes.body.data.length, 1);
    assert.ok(searchRes.body.data[0].title.toLowerCase().includes('mutual'));

    // 8. Get Chat messages detail
    console.log('8. Testing GET /api/chat/:chatId (retrieve messages)...');
    const detailRes = await makeRequest('GET', `/api/chat/${firstChatId}`, authHeaders);
    assert.strictEqual(detailRes.statusCode, 200);
    assert.strictEqual(detailRes.body.status, 'success');
    assert.ok(Array.isArray(detailRes.body.messages));
    assert.strictEqual(detailRes.body.messages.length, 2); // 1 user + 1 AI
    assert.strictEqual(detailRes.body.messages[0].content, 'What insurance should I buy?');

    // 9. Delete specific chat
    console.log('9. Testing DELETE /api/chat/:chatId (delete conversation)...');
    const deleteRes = await makeRequest('DELETE', `/api/chat/${firstChatId}`, authHeaders);
    assert.strictEqual(deleteRes.statusCode, 200);
    assert.strictEqual(deleteRes.body.status, 'success');

    // Check conversation count after single delete
    const postDeleteHistoryRes = await makeRequest('GET', '/api/chat/history', authHeaders);
    assert.strictEqual(postDeleteHistoryRes.body.data.length, 1);

    // 10. Delete all history
    console.log('10. Testing DELETE /api/chat/history (clear all chats)...');
    const clearRes = await makeRequest('DELETE', '/api/chat/history', authHeaders);
    assert.strictEqual(clearRes.statusCode, 200);
    assert.strictEqual(clearRes.body.status, 'success');

    // Check conversation count after clear all
    const postClearHistoryRes = await makeRequest('GET', '/api/chat/history', authHeaders);
    assert.strictEqual(postClearHistoryRes.body.data.length, 0);

    console.log('\n=============================================');
    console.log('ALL CHAT HISTORY INTEGRATION TESTS PASSED! (10/10)');
    console.log('=============================================\n');

    // Cleanup DB
    console.log('Cleaning up database test records...');
    await mongoose.connect(MONGO_URI);
    await User.findByIdAndDelete(userId);
    await Conversation.deleteMany({ userId });
    await ChatHistory.deleteMany({ userId });
    await mongoose.disconnect();
    console.log('Cleanup complete. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('\n!!! TEST ASSERTION FAILED !!!');
    console.error(err);
    
    // Attempt database cleanup in case of crash
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI);
      }
      if (userId) {
        await User.findByIdAndDelete(userId);
        await Conversation.deleteMany({ userId });
        await ChatHistory.deleteMany({ userId });
      }
      await mongoose.disconnect();
    } catch (cleanupErr) {
      console.error('Failed to cleanup database:', cleanupErr);
    }
    
    process.exit(1);
  }
};

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
