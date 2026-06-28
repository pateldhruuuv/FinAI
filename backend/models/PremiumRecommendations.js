const mongoose = require('mongoose');

const PremiumRecommendationsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  investmentAdvice: {
    type: String,
    default: '',
  },
  insuranceAdvice: {
    type: String,
    default: '',
  },
  taxAdvice: {
    type: String,
    default: '',
  },
  tripAdvice: {
    type: String,
    default: '',
  },
  purchaseAdvice: {
    type: String,
    default: '',
  },
  debtAdvice: {
    type: String,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PremiumRecommendations', PremiumRecommendationsSchema);
