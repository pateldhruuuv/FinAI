const mongoose = require('mongoose');

const TaxCalculationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  income: {
    annualSalary: { type: Number, default: 0 },
    businessIncome: { type: Number, default: 0 },
    rentalIncome: { type: Number, default: 0 },
    capitalGains: { type: Number, default: 0 },
    otherIncome: { type: Number, default: 0 },
    interestIncome: { type: Number, default: 0 },
    dividendIncome: { type: Number, default: 0 },
    grossIncome: { type: Number, required: true },
    taxableIncome: { type: Number, required: true }
  },
  regime: {
    type: String, // 'old' or 'new'
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  residentialStatus: {
    type: String, // 'Resident', 'Non-Resident', 'RNOR'
    required: true
  },
  financialYear: {
    type: String, // 'FY 2023-24', 'FY 2024-25', 'FY 2025-26'
    required: true
  },
  tax: {
    totalTax: { type: Number, required: true }, // Tax before rebate
    rebateApplied: { type: Number, default: 0 },
    surcharge: { type: Number, default: 0 },
    marginalRelief: { type: Number, default: 0 },
    cess: { type: Number, required: true },
    finalTaxLiability: { type: Number, required: true },
    taxRefund: { type: Number, default: 0 },
    taxPayable: { type: Number, default: 0 },
    averageTaxRate: { type: Number, default: 0 },
    effectiveTaxRate: { type: Number, default: 0 },
    marginalTaxRate: { type: Number, default: 0 },
    slabBreakdown: [{
      slab: { type: String, required: true },
      rate: { type: Number, required: true },
      incomeInSlab: { type: Number, required: true },
      taxForSlab: { type: Number, required: true }
    }]
  },
  deductions: [{
    code: { type: String, required: true }, // 'sec80C', 'sec80D', etc.
    name: { type: String, required: true }, // "Section 80C", etc.
    claimedAmount: { type: Number, default: 0 },
    maxAllowed: { type: Number, default: null }, // can be null for variable limit
    appliedAmount: { type: Number, default: 0 },
    unusedBenefit: { type: Number, default: 0 }
  }],
  recommendations: [{
    recommendation: { type: String, required: true },
    estimatedTaxSaved: { type: Number, required: true },
    investmentRequired: { type: Number, required: true },
    priority: { type: String, required: true }, // 'High', 'Medium', 'Low'
    reason: { type: String, required: true },
    expectedROI: { type: Number, default: 0 },
    difficulty: { type: String, default: 'Easy' }, // 'Easy', 'Medium', 'Hard'
    deadline: { type: String, default: 'March 31' }
  }],
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

// Explicitly set collection name to TaxCalculations
module.exports = mongoose.model('TaxCalculation', TaxCalculationSchema, 'TaxCalculations');
