const mongoose = require('mongoose');

const ReportsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportType: {
    type: String,
    required: true,
    enum: ['Monthly', 'Quarterly', 'Yearly'],
  },
  reportDate: {
    type: Date,
    default: Date.now,
  },
  fileFormat: {
    type: String,
    required: true,
    enum: ['PDF', 'CSV'],
  },
  summary: {
    income: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    healthScore: { type: Number, default: 0 },
    debt: { type: Number, default: 0 },
  },
  recommendations: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Reports', ReportsSchema);
