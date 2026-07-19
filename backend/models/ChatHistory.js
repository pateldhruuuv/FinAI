const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: false, // Optional for legacy compatibility during migration
  },
  sender: {
    type: String,
    enum: ['user', 'ai', 'assistant', 'system'],
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
    default: function() {
      if (this.sender === 'ai' || this.sender === 'assistant') return 'assistant';
      if (this.sender === 'system') return 'system';
      return 'user';
    }
  },
  message: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
    default: function() {
      return this.message;
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    modelUsed: { type: String },
    responseTime: { type: Number },
    tokens: { type: Number },
  }
});

// Proper indexes for faster queries
ChatHistorySchema.index({ conversationId: 1, timestamp: 1 });
ChatHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
