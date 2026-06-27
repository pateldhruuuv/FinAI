const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [0, 'Budget cannot be negative'],
  },
  estimatedCost: {
    type: Number,
    required: [true, 'Estimated cost is required'],
    min: [0, 'Estimated cost cannot be negative'],
  },
  recommendation: {
    type: String,
    required: [true, 'Recommendation status is required'],
  },
  numberOfTravelers: {
    type: Number,
    default: 1,
    min: [1, 'Number of travelers must be at least 1'],
  },
  travelDates: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Trip', TripSchema);
