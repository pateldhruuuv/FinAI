const mongoose = require('mongoose');

const ForecastSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  forecastType: {
    type: String,
    enum: ['Savings', 'Expenses'],
    required: true,
  },
  predicted3M: {
    type: Number,
    required: true,
  },
  predicted6M: {
    type: Number,
    required: true,
  },
  predicted12M: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Forecast', ForecastSchema);
