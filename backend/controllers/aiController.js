const Recommendation = require('../models/Recommendation');
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// Helper to get user financials for AI context
const getUserFinancialContext = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const transactions = await Transaction.find({ userId });
  let totalIncome = 0;
  let totalExpenses = 0;
  let debt = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'Credit') {
      totalIncome += tx.amount;
    } else {
      totalExpenses += tx.amount;
      const catLower = tx.category.toLowerCase();
      if (catLower.includes('emi') || catLower.includes('debt') || catLower.includes('loan') || catLower.includes('credit card')) {
        debt += tx.amount;
      }
    }
  });

  const income = totalIncome > 0 ? totalIncome : user.monthlyIncome;
  const savings = totalIncome > 0 ? Math.max(totalIncome - totalExpenses, 0) : Math.max(user.monthlyIncome - totalExpenses, 0);

  return {
    age: user.age,
    income,
    expenses: totalExpenses,
    savings,
    debt,
  };
};

// Recommend Investment
exports.recommendInvestment = async (req, res) => {
  try {
    const { risk_profile } = req.body;
    if (!risk_profile) {
      return res.status(400).json({ status: 'error', message: 'Risk profile is required (Conservative, Moderate, Aggressive)' });
    }

    const context = await getUserFinancialContext(req.user);

    // Call FastAPI
    const response = await fetch(`${AI_SERVICE_URL}/recommend-investment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: context.age,
        income: context.income,
        savings: context.savings,
        risk_profile: risk_profile,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Engine error: ${errorText}` });
    }

    const result = await response.json();

    // Update or insert recommendations in DB
    const rec = await Recommendation.findOneAndUpdate(
      { userId: req.user },
      {
        shortTermInvestment: result.short_term,
        longTermInvestment: result.long_term,
        // Set default values if not exists
        $setOnInsert: {
          healthScore: 50,
          healthStatus: 'Moderate',
          insuranceCoverageAmount: 1000000,
          recommendedInsurance: ['Basic Health Insurance'],
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      status: 'success',
      data: {
        shortTerm: result.short_term,
        longTerm: result.long_term,
        recommendedAllocations: result.recommended_allocations,
        recommendationId: rec._id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error during investment recommendation' });
  }
};

// Recommend Insurance
exports.recommendInsurance = async (req, res) => {
  try {
    const { dependents, marital_status } = req.body;
    if (dependents === undefined || !marital_status) {
      return res.status(400).json({ status: 'error', message: 'Dependents and marital status are required' });
    }

    const context = await getUserFinancialContext(req.user);

    // Call FastAPI
    const response = await fetch(`${AI_SERVICE_URL}/recommend-insurance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: context.age,
        income: context.income,
        dependents: parseInt(dependents),
        marital_status: marital_status,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Engine error: ${errorText}` });
    }

    const result = await response.json();

    // Update Recommendation in DB
    const rec = await Recommendation.findOneAndUpdate(
      { userId: req.user },
      {
        recommendedInsurance: result.recommendations_summary,
        insuranceCoverageAmount: result.suggested_coverage_amount,
        $setOnInsert: {
          healthScore: 50,
          healthStatus: 'Moderate',
          shortTermInvestment: 'Fixed Deposit',
          longTermInvestment: 'Mutual Funds',
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      status: 'success',
      data: {
        healthInsuranceLevel: result.health_insurance_level,
        termInsuranceRecommended: result.term_insurance_recommended,
        accidentInsuranceRecommended: result.accident_insurance_recommended,
        suggestedCoverageAmount: result.suggested_coverage_amount,
        recommendationsSummary: result.recommendations_summary,
        recommendationId: rec._id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error during insurance recommendation' });
  }
};

// Predict Financial Health
exports.predictHealth = async (req, res) => {
  try {
    const context = await getUserFinancialContext(req.user);

    // Call FastAPI
    const response = await fetch(`${AI_SERVICE_URL}/predict-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: context.age,
        income: context.income,
        expenses: context.expenses,
        savings: context.savings,
        debt: context.debt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Engine error: ${errorText}` });
    }

    const result = await response.json();

    // Update Recommendation in DB
    // Determine a dynamic health score based on prediction status if they haven't run statement calculations
    let score = 50;
    if (result.prediction === 'Healthy') score = 85;
    else if (result.prediction === 'Moderate') score = 55;
    else score = 25;

    const rec = await Recommendation.findOneAndUpdate(
      { userId: req.user },
      {
        healthStatus: result.prediction,
        healthScore: score,
        $setOnInsert: {
          shortTermInvestment: 'Fixed Deposit',
          longTermInvestment: 'Mutual Funds',
          insuranceCoverageAmount: 1000000,
          recommendedInsurance: ['Basic Health Insurance'],
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      status: 'success',
      data: {
        prediction: result.prediction,
        suggestions: result.suggestions,
        recommendationId: rec._id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error during health prediction' });
  }
};

// Chatbot Interaction
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ status: 'error', message: 'Message is required' });
    }

    // Call FastAPI
    const response = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Engine error: ${errorText}` });
    }

    const result = await response.json();

    // Save user query to ChatHistory
    const userChat = new ChatHistory({
      userId: req.user,
      sender: 'user',
      message: message,
    });
    await userChat.save();

    // Save AI reply to ChatHistory
    const aiChat = new ChatHistory({
      userId: req.user,
      sender: 'ai',
      message: result.reply,
    });
    await aiChat.save();

    res.json({
      status: 'success',
      reply: result.reply,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during chatbot interaction' });
  }
};
