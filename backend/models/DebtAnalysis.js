const mongoose = require('mongoose');

const DebtAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  monthlyIncome: {
    type: Number,
    required: true,
    min: 0,
  },
  monthlyExpenses: {
    type: Number,
    required: true,
    min: 0,
  },
  totalDebt: {
    type: Number,
    required: true,
    min: 0,
  },
  emiAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  debtRiskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  category: {
    type: String,
    enum: ['Critical', 'Moderate', 'Healthy'],
    required: true,
  },
  priorityList: {
    type: [String],
    default: [],
  },
  repaymentPlan: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DebtAnalysis', DebtAnalysisSchema);
