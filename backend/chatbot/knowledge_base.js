const fs = require('fs');
const path = require('path');

let featuresData = null;

const loadFeatures = () => {
  if (!featuresData) {
    try {
      const filePath = path.join(__dirname, 'features.json');
      const rawData = fs.readFileSync(filePath, 'utf8');
      featuresData = JSON.parse(rawData);
    } catch (err) {
      console.error('Failed to load features.json knowledge base:', err);
      featuresData = { features: [] };
    }
  }
  return featuresData.features;
};

const getFeatureById = (id) => {
  const features = loadFeatures();
  return features.find(f => f.id === id);
};

const getAllFeatures = () => {
  return loadFeatures();
};

const getFeatureByIntent = (intent) => {
  const features = loadFeatures();
  const intentMap = {
    'Investment': 'investment_advisor',
    'Insurance': 'insurance_advisor',
    'Loans': 'loan_advisor',
    'Tax': 'tax_optimizer',
    'Budget': 'financial_health',
    'Expense Analysis': 'expense_analysis',
    'Financial Health': 'financial_health',
    'Stock Recommendation': 'investment_advisor',
    'Goal Planning': 'goal_planning',
    'Reports': 'reports',
    'Settings': 'linked_accounts',
    'Premium Features': 'financial_twin',
    'General Platform Help': 'financial_health'
  };
  const featureId = intentMap[intent];
  if (featureId) {
    return features.find(f => f.id === featureId);
  }
  return null;
};

module.exports = {
  getFeatureById,
  getAllFeatures,
  getFeatureByIntent
};
