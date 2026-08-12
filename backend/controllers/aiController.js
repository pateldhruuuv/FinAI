const Recommendation = require('../models/Recommendation');
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

const extractGeminiReply = (data) => {
  if (data?.output_text) return data.output_text;

  const modelOutput = data?.steps?.find((step) => step.type === 'model_output');
  const textPart = modelOutput?.content?.find((part) => part.type === 'text');
  return textPart?.text || 'Sorry, I could not generate a response right now.';
};

const buildChatPrompt = ({ message, context, history, advisorContext }) => {
  const recentMessages = history
    .map((chat) => `${chat.sender === 'user' ? 'User' : 'FinPilot'}: ${chat.message}`)
    .join('\n');

  return `You are FinPilot, a helpful financial assistant inside a personal finance app.

CRITICAL INSTRUCTIONS:
- You must ONLY answer questions regarding the user's financial details, portfolios, goals, tax optimization, loan eligibility, and debt rescue in this app.
- If the user asks general questions outside personal finance or this project (e.g. "who is the president", "explain photosynthesis", "write python code", "how to build a house"), you MUST decline politely: "I am your FinPilot assistant. I can only help you with questions related to your personal finances, investments, goals, and advisor utilities in this application."
- Under no circumstances answer off-topic questions.
- If a calculation result is provided under "Advisory Calculations", use those exact numbers and rephrase them nicely in a conversational, helpful personal advisor tone.

User financial context:
Age: ${context.age || 'Not available'}
Income: ${context.income || 0}
Expenses: ${context.expenses || 0}
Savings: ${context.savings || 0}
Debt: ${context.debt || 0}

${advisorContext ? `Advisory Calculations:\n${advisorContext}\n` : ''}

Recent conversation:
${recentMessages || 'No previous messages.'}

User message:
${message}`;
};

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
        suggestions: result.suggestions,
        passiveIncomeStrategies: result.passive_income_strategies,
        concreteOptions: result.concrete_options,
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
        concreteOptions: result.concrete_options,
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
    if (!message?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        status: 'error',
        message: 'Gemini API key is not configured. Add GEMINI_API_KEY to backend/.env',
      });
    }

    const context = await getUserFinancialContext(req.user);
    
    // Perform dynamic calculation checks depending on intent
    const qLower = message.toLowerCase();
    let advisorContext = "";

    try {
      if (qLower.includes('invest') || qLower.includes('portfolio') || qLower.includes('mutual fund') || qLower.includes('stock') || qLower.includes('equity') || qLower.includes('fixed deposit') || qLower.includes('fd') || qLower.includes('gold')) {
        const response = await fetch(`${AI_SERVICE_URL}/recommend-investment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            age: context.age || 30,
            income: context.income || 50000,
            savings: context.savings || 10000,
            risk_profile: 'Moderate',
          }),
        });
        if (response.ok) {
          const resVal = await response.json();
          advisorContext = `[Advisory Calculation - Investment]: Recommended allocations: Cash/FD: ${resVal.recommended_allocations?.["Cash/FD"] || "30%"}, Bonds/Debt: ${resVal.recommended_allocations?.["Bonds/Debt"] || "30%"}, Equity: ${resVal.recommended_allocations?.["Equity"] || "40%"}. Short-term advice: ${resVal.short_term}. Long-term advice: ${resVal.long_term}.`;
        }
      } else if (qLower.includes('insure') || qLower.includes('insurance') || qLower.includes('health cover') || qLower.includes('term plan')) {
        const response = await fetch(`${AI_SERVICE_URL}/recommend-insurance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            age: context.age || 30,
            income: context.income || 50000,
            dependents: 1,
            marital_status: 'Single',
          }),
        });
        if (response.ok) {
          const resVal = await response.json();
          advisorContext = `[Advisory Calculation - Insurance]: Suggested Term Insurance: ${resVal.term_insurance_recommended}, Health Insurance level: ${resVal.health_insurance_level}, Suggested Coverage: ₹${resVal.suggested_coverage_amount}. Recommendations: ${resVal.recommendations_summary?.join(', ')}`;
        }
      } else if (qLower.includes('loan') || qLower.includes('borrow') || qLower.includes('credit score') || qLower.includes('emi') || qLower.includes('debt')) {
        const response = await fetch(`${AI_SERVICE_URL}/loan-advisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            income: context.income || 50000,
            age: context.age || 30,
            credit_score: 750,
            current_emi: context.debt || 0,
            existing_loans: context.debt || 0,
          }),
        });
        if (response.ok) {
          const resVal = await response.json();
          advisorContext = `[Advisory Calculation - Loan Eligibility]: Maximum EMI user can pay: ₹${resVal.maximumEmi}, Safe EMI: ₹${resVal.safeEmi}, Loan Risk Assessment: ${resVal.loanRisk}, Max Eligible Loan amount: ₹${resVal.eligibleAmount}. Breakdown: Home Loan: ₹${resVal.breakdown?.homeLoan}, Car Loan: ₹${resVal.breakdown?.carLoan}.`;
        }
      } else if (qLower.includes('tax') || qLower.includes('deduction') || qLower.includes('80c') || qLower.includes('80d') || qLower.includes('hra') || qLower.includes('rent')) {
        const response = await fetch(`${AI_SERVICE_URL}/tax-optimizer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            annual_income: (context.income || 50000) * 12,
            salary_basic: (context.income || 50000) * 12 * 0.4,
            salary_hra: (context.income || 50000) * 12 * 0.15,
            salary_special: 0,
            salary_other: 0,
            deductions_80c: 150000,
            deductions_80d: 25000,
            home_loan: 0,
            education_loan: 0,
            rent_paid: 120000,
          }),
        });
        if (response.ok) {
          const resVal = await response.json();
          advisorContext = `[Advisory Calculation - Tax Optimization]: Taxable Income: ₹${resVal.taxableIncome}, Current calculated Tax: ₹${resVal.currentTax}, Potential savings through optimization: ₹${resVal.potentialSavings}. Recommended actions: ${resVal.recommendedInvestments?.join(', ')}.`;
        }
      }
    } catch (err) {
      console.warn("Under-the-hood intent calculations failed:", err.message);
    }

    const history = await ChatHistory.find({ userId: req.user }).sort({ timestamp: -1 }).limit(8).lean();
    const prompt = buildChatPrompt({
      message: message.trim(),
      context,
      history: history.reverse(),
      advisorContext,
    });

    let reply = "";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          input: prompt,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        reply = extractGeminiReply(result);
      } else {
        throw new Error(`Gemini API error status: ${response.status}`);
      }
    } catch (geminiErr) {
      clearTimeout(timeoutId);
      console.warn("Gemini chatbot connection failed; falling back to local advisor. Error:", geminiErr.message);
      
      if (advisorContext) {
        reply = advisorContext.replace(/\[Advisory Calculation - [^\]]+\]:\s*/g, '');
      } else {
        reply = `Based on your profile, your monthly income is ₹${(context.income || 0).toLocaleString()} and your savings are ₹${(context.savings || 0).toLocaleString()}. Please ask specifically about investments, insurance, tax, or loan calculators to get detailed recommendations.`;
      }
    }

    // Save user query to ChatHistory
    const userChat = new ChatHistory({
      userId: req.user,
      sender: 'user',
      message: message.trim(),
    });
    await userChat.save();

    // Save AI reply to ChatHistory
    const aiChat = new ChatHistory({
      userId: req.user,
      sender: 'ai',
      message: reply,
    });
    await aiChat.save();

    res.json({
      status: 'success',
      reply,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during chatbot interaction' });
  }
};