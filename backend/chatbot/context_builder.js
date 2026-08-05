const User = require('../models/User');
const Transaction = require('../models/Transaction');
const RecommendationHistory = require('../models/RecommendationHistory');
const { getAllFeatures } = require('./knowledge_base');

const buildContext = async (userId, currentPage = 'Dashboard', selectedModule = 'Dashboard') => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Calculate financial figures
  const transactions = await Transaction.find({ userId });
  let totalIncome = 0;
  let totalExpenses = 0;
  let debt = 0;
  const categoryTotals = {};

  transactions.forEach((tx) => {
    if (tx.type === 'Credit') {
      totalIncome += tx.amount;
    } else {
      totalExpenses += tx.amount;
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;

      const catLower = tx.category.toLowerCase();
      if (catLower.includes('emi') || catLower.includes('debt') || catLower.includes('loan') || catLower.includes('credit card')) {
        debt += tx.amount;
      }
    }
  });

  const incomeBase = totalIncome > 0 ? totalIncome : user.monthlyIncome;
  const savings = totalIncome > 0 ? Math.max(totalIncome - totalExpenses, 0) : Math.max(user.monthlyIncome - totalExpenses, 0);
  const savingsRatio = incomeBase > 0 ? savings / incomeBase : 0;
  const debtRatio = incomeBase > 0 ? debt / incomeBase : 0;
  const emergencyFundRatio = totalExpenses > 0 ? savings / totalExpenses : 0;

  // Calculate Financial Health Score (0-100)
  let savingsScore = 0;
  if (savingsRatio >= 0.3) savingsScore = 40;
  else if (savingsRatio >= 0.1) savingsScore = 20;
  else savingsScore = 5;

  let debtScore = 0;
  if (debtRatio <= 0.2) debtScore = 30;
  else if (debtRatio <= 0.4) debtScore = 15;
  else debtScore = 0;

  let emergencyScore = 0;
  if (emergencyFundRatio >= 3.0) emergencyScore = 30;
  else if (emergencyFundRatio >= 1.0) emergencyScore = 15;
  else emergencyScore = 0;

  const healthScore = savingsScore + debtScore + emergencyScore;
  let healthStatus = 'Average';
  if (healthScore >= 81) healthStatus = 'Excellent';
  else if (healthScore >= 61) healthStatus = 'Good';
  else if (healthScore >= 31) healthStatus = 'Average';
  else healthStatus = 'Critical';

  // Summarize detailed transactions (last 50) for the chatbot knowledge context
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const transactionsSummary = sortedTransactions.slice(0, 50).map(tx => ({
    date: tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : new Date(tx.date).toISOString().split('T')[0],
    description: tx.description,
    category: tx.category,
    type: tx.type || tx.transactionType || (tx.amount > 0 && tx.type === 'Credit' ? 'Credit' : 'Debit'),
    amount: tx.amount
  }));

  // Get recent recommendations
  const recHist = await RecommendationHistory.findOne({ userId }).sort({ createdAt: -1 });
  const recentRecommendations = recHist ? recHist.recommendations : [];

  // Filter features
  const allFeatures = getAllFeatures();
  const availableFeatures = allFeatures.filter(f => !f.premium || user.isPremium).map(f => f.name);
  const premiumFeatures = allFeatures.filter(f => f.premium).map(f => f.name);

  return {
    userName: user.name,
    isPremium: user.isPremium,
    healthScore,
    healthStatus,
    income: incomeBase,
    expenses: totalExpenses,
    savings,
    debt,
    riskProfile: user.riskProfile || 'Moderate',
    investmentExperience: user.investmentExperience || 'Intermediate',
    dependents: user.dependents || 0,
    occupation: user.occupation || 'Employee',
    age: user.age || 30,
    availableFeatures,
    premiumFeatures,
    recentRecommendations,
    transactionsSummary,
    currentPage,
    selectedModule
  };
};

module.exports = {
  buildContext
};
