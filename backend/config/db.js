const mongoose = require('mongoose');
const migrateChatHistory = require('../scripts/migrateChatHistory');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finpilot');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Run chat history migrations
    await migrateChatHistory();
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
