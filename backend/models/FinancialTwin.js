const mongoose = require('mongoose');

const FinancialTwinSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  income: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  goalsCount: { type: Number, default: 0 },
  assets: {
    stocks: { type: Number, default: 0 },
    mutualFunds: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
    fd: { type: Number, default: 0 },
    crypto: { type: Number, default: 0 },
    property: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
  },
  liabilities: {
    debt: { type: Number, default: 0 },
    loans: { type: Number, default: 0 },
  },
  insurance: {
    healthCoverage: { type: Number, default: 0 },
    termCoverage: { type: Number, default: 0 },
  },
  financialAge: { type: Number, required: true },
  riskLevel: { type: String, required: true, enum: ['Conservative', 'Moderate', 'Aggressive'] },
  savingsPersonality: { type: String, required: true },
  investmentPersonality: { type: String, required: true },
  stabilityScore: { type: Number, required: true },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FinancialTwin', FinancialTwinSchema);
