const mongoose = require('mongoose');

const TaxAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  annualIncome: {
    type: Number,
    required: true,
  },
  salaryStructure: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  deductions80C: {
    type: Number,
    default: 0,
  },
  deductions80D: {
    type: Number,
    default: 0,
  },
  homeLoanInterest: {
    type: Number,
    default: 0,
  },
  educationLoanInterest: {
    type: Number,
    default: 0,
  },
  hraExemption: {
    type: Number,
    default: 0,
  },
  rentPaid: {
    type: Number,
    default: 0,
  },
  taxableIncome: {
    type: Number,
    required: true,
  },
  currentTax: {
    type: Number,
    required: true,
  },
  potentialSavings: {
    type: Number,
    default: 0,
  },
  recommendedInvestments: {
    type: [String],
    default: [],
  },
  taxBreakdownChart: {
    type: String, // Base64 encoded chart
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('TaxAnalysis', TaxAnalysisSchema);
