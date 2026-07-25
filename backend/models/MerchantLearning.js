const mongoose = require('mongoose');

const MerchantLearningSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  merchantName: {
    type: String,
    required: true,
    trim: true,
  },
  correctedCategory: {
    type: String,
    required: true,
    trim: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('MerchantLearning', MerchantLearningSchema);
