const mongoose = require('mongoose');

const LoansSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  income: {
    type: Number,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  creditScore: {
    type: Number,
    default: 750,
  },
  currentEmi: {
    type: Number,
    default: 0,
  },
  existingLoans: {
    type: Number,
    default: 0,
  },
  eligibleAmount: {
    type: Number,
    required: true,
  },
  maximumEmi: {
    type: Number,
    required: true,
  },
  safeEmi: {
    type: Number,
    required: true,
  },
  loanRisk: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High'],
  },
  breakdown: {
    personalLoan: { type: Number, default: 0 },
    educationLoan: { type: Number, default: 0 },
    carLoan: { type: Number, default: 0 },
    homeLoan: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Loans', LoansSchema);
