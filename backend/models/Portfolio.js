const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stocks: { type: Number, default: 0 },
  mutualFunds: { type: Number, default: 0 },
  gold: { type: Number, default: 0 },
  fd: { type: Number, default: 0 },
  crypto: { type: Number, default: 0 },
  property: { type: Number, default: 0 },
  riskScore: { type: Number, required: true },
  diversification: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
  safeAllocation: {
    cashFd: { type: Number, default: 0 },
    bondsDebt: { type: Number, default: 0 },
    equity: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
  },
  recommendations: { type: [String], default: [] },
  highRiskAssets: { type: [String], default: [] },
  portfolioChart: { type: String }, // Base64 encoded pie chart
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
