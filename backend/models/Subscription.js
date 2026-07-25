const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  frequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Yearly'],
    default: 'Monthly',
  },
  monthlyCost: {
    type: Number,
    required: true,
  },
  annualCost: {
    type: Number,
    required: true,
  },
  renewalDate: {
    type: Date,
    required: true,
  },
  totalSubscriptionSpending: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
