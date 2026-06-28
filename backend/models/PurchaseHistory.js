const mongoose = require('mongoose');

const PurchaseHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  item: {
    type: String,
    required: true,
    trim: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  purchaseScore: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Buy', 'Wait', 'Avoid'],
  },
  suggestions: {
    refurbishedOption: { type: String, default: '' },
    emiOption: { type: String, default: '' },
    secondHandOption: { type: String, default: '' },
    betterAlternative: { type: String, default: '' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PurchaseHistory', PurchaseHistorySchema);
