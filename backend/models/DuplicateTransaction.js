const mongoose = require('mongoose');

const DuplicateTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  merchant: {
    type: String,
    trim: true,
    default: 'Unknown',
  },
  category: {
    type: String,
    trim: true,
    default: 'Miscellaneous',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['Credit', 'Debit'],
  },
  referenceNumber: {
    type: String,
    trim: true,
    default: null,
  },
  accountNumber: {
    type: String,
    trim: true,
    default: null,
  },
  currency: {
    type: String,
    trim: true,
    default: 'INR',
  },
  originalRowNumber: {
    type: Number,
    default: null,
  },
  duplicateRowNumber: {
    type: Number,
    default: null,
  },
  reason: {
    type: String,
    trim: true,
  },
  sourceFile: {
    type: String,
    trim: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('DuplicateTransaction', DuplicateTransactionSchema);
