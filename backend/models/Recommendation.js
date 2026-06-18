const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  healthScore: {
    type: Number,
    required: true,
  },
  healthStatus: {
    type: String,
    enum: ['Healthy', 'Moderate', 'Risky'],
    required: true,
  },
  shortTermInvestment: {
    type: String,
    required: true,
  },
  longTermInvestment: {
    type: String,
    required: true,
  },
  recommendedInsurance: {
    type: [String],
    default: [],
  },
  insuranceCoverageAmount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);
