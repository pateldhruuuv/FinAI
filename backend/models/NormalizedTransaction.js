const mongoose = require('mongoose');

const NormalizedTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  merchant: {
    type: String,
    trim: true,
    default: 'Unknown',
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  transactionType: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['Credit', 'Debit'],
  },
  balance: {
    type: Number,
    default: 0,
  },
  confidence: {
    type: Number,
    default: 1.0,
  },
  is_unknown: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('NormalizedTransaction', NormalizedTransactionSchema);
