const mongoose = require('mongoose');

const RecurringTransactionSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  frequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Yearly'],
    default: 'Monthly',
  },
  nextDueDate: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    required: true, // EMI, Rent, Utility, Salary, Insurance Premium
  },
  lastPaymentDate: {
    type: Date,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('RecurringTransaction', RecurringTransactionSchema);
