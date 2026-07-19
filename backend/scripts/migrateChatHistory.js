const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const ChatHistory = require('../models/ChatHistory');

const migrateChatHistory = async () => {
  try {
    console.log('Starting chat history schema migration...');

    // Find all messages that don't have a conversationId
    const looseMessages = await ChatHistory.find({
      $or: [
        { conversationId: { $exists: false } },
        { conversationId: null }
      ]
    }).sort({ timestamp: 1 });

    if (looseMessages.length === 0) {
      console.log('No loose chat history messages found. Migration not needed.');
      return;
    }

    console.log(`Found ${looseMessages.length} loose messages to migrate.`);

    // Group loose messages by userId
    const messagesByUser = {};
    looseMessages.forEach(msg => {
      if (!messagesByUser[msg.userId]) {
        messagesByUser[msg.userId] = [];
      }
      messagesByUser[msg.userId].push(msg);
    });

    const userIds = Object.keys(messagesByUser);
    console.log(`Migrating messages for ${userIds.length} users...`);

    for (const userId of userIds) {
      const userMsgs = messagesByUser[userId];
      
      // Auto-generate a title from the first user message, or default to "Imported Chat"
      const firstUserMsg = userMsgs.find(m => m.sender === 'user') || userMsgs[0];
      let title = 'Imported Chat';
      if (firstUserMsg && firstUserMsg.message) {
        title = firstUserMsg.message.trim().substring(0, 40);
        if (firstUserMsg.message.trim().length > 40) title += '...';
      }

      // Create a conversation for these messages
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId(userId),
        title,
        createdAt: userMsgs[0].timestamp || new Date(),
        updatedAt: userMsgs[userMsgs.length - 1].timestamp || new Date()
      });

      await conversation.save();
      console.log(`Created conversation "${title}" (ID: ${conversation._id}) for user ${userId}`);

      // Update messages in batch
      for (const msg of userMsgs) {
        msg.conversationId = conversation._id;
        // Make sure role and content are correctly set
        if (!msg.role) {
          msg.role = msg.sender === 'ai' ? 'assistant' : 'user';
        }
        if (!msg.content) {
          msg.content = msg.message;
        }
        await msg.save();
      }
      console.log(`Associated ${userMsgs.length} messages with conversation ${conversation._id}`);
    }

    console.log('Chat history migration completed successfully.');
  } catch (error) {
    console.error('Error during chat history migration:', error);
  }
};

module.exports = migrateChatHistory;
