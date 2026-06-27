const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  goalName: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true,
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0, 'Target amount cannot be negative'],
  },
  currentSavings: {
    type: Number,
    required: [true, 'Current savings is required'],
    min: [0, 'Current savings cannot be negative'],
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required'],
  },
  progress: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Goal', GoalSchema);
