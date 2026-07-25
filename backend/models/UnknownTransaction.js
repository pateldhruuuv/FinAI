const mongoose = require('mongoose');

const UnknownTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NormalizedTransaction',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionType: {
    type: String,
    enum: ['Debit', 'Credit'],
    required: true,
  },
  possibleMerchant: {
    type: String,
    trim: true,
  },
  possibleCategory: {
    type: String,
    trim: true,
  },
  confidence: {
    type: Number,
    default: 0.5,
  },
  status: {
    type: String,
    enum: ['Needs Review', 'Resolved'],
    default: 'Needs Review',
  }
}, { timestamps: true });

module.exports = mongoose.model('UnknownTransaction', UnknownTransactionSchema);
