const mongoose = require('mongoose');

const LinkedAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountType: {
    type: String,
    enum: ['bank', 'investment', 'insurance'],
    required: true,
  },
  institutionName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    min: [0, 'Balance cannot be negative'],
  },
  currency: {
    type: String,
    default: 'INR',
  },
  lastRefreshed: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LinkedAccount', LinkedAccountSchema);
