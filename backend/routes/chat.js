const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// All chat routes are protected
router.use(auth);

// GET /api/chat/history - Get all user conversations
router.get('/history', chatController.getChatHistory);

// GET /api/chat/:chatId - Get messages in conversation
router.get('/:chatId', chatController.getChatById);

// POST /api/chat - Start new conversation (with optional initial message)
router.post('/', chatController.createChat);

// POST /api/chat/:chatId/message - Send message to existing conversation
router.post('/:chatId/message', chatController.postMessage);

// PUT /api/chat/:chatId - Rename conversation
router.put('/:chatId', chatController.renameChat);

// DELETE /api/chat/history - Delete all history/conversations
router.delete('/history', chatController.deleteChatHistory);

// DELETE /api/chat/:chatId - Delete conversation
router.delete('/:chatId', chatController.deleteChat);

module.exports = router;
