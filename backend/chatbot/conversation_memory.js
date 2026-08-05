const ChatHistory = require('../models/ChatHistory');

const getRecentHistory = async (conversationId, limit = 6) => {
  if (!conversationId) return [];
  
  const history = await ChatHistory.find({ conversationId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
    
  return history.reverse().map(msg => ({
    role: msg.role || (msg.sender === 'ai' ? 'assistant' : 'user'),
    content: msg.content || msg.message || ''
  }));
};

module.exports = {
  getRecentHistory
};
