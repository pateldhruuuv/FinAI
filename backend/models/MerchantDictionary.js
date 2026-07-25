const mongoose = require('mongoose');

const MerchantDictionarySchema = new mongoose.Schema({
  merchant: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  keywords: {
    type: [String],
    default: [],
  },
  confidence: {
    type: Number,
    default: 1.0,
  }
}, { timestamps: true });

module.exports = mongoose.model('MerchantDictionary', MerchantDictionarySchema);
