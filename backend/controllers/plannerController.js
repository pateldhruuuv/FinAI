const Goal = require('../models/Goal');
const Trip = require('../models/Trip');
const DebtAnalysis = require('../models/DebtAnalysis');
const Notification = require('../models/Notification');
const RecommendationHistory = require('../models/RecommendationHistory');
const Forecast = require('../models/Forecast');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// Helper: Calculate user's monthly savings rate
const getUserFinancials = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const transactions = await Transaction.find({ userId });
  let totalIncome = 0;
  let totalExpenses = 0;
  let emiAmount = 0;
  const categoryTotals = {};

  transactions.forEach((tx) => {
    if (tx.type === 'Credit') {
      totalIncome += tx.amount;
    } else {
      totalExpenses += tx.amount;
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;

      const catLower = tx.category.toLowerCase();
      if (catLower.includes('emi') || catLower.includes('debt') || catLower.includes('loan') || catLower.includes('credit card')) {
        emiAmount += tx.amount;
      }
    }
  });

  const monthlyIncome = totalIncome > 0 ? totalIncome : user.monthlyIncome;
  const monthlyExpenses = totalExpenses;
  const monthlySavings = Math.max(monthlyIncome - monthlyExpenses, 0);

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    emiAmount,
    categoryTotals,
    transactions,
    age: user.age
  };
};

// ==========================================
// FEATURE 1: Goals Planner
// ==========================================

exports.createGoal = async (req, res) => {
  try {
    const { goalName, targetAmount, currentSavings, targetDate } = req.body;
    if (!goalName || !targetAmount || currentSavings === undefined || !targetDate) {
      return res.status(400).json({ status: 'error', message: 'All goal fields are required' });
    }

    const progress = Math.min(Math.round((currentSavings / targetAmount) * 100), 100);

    const goal = new Goal({
      userId: req.user,
      goalName,
      targetAmount: parseFloat(targetAmount),
      currentSavings: parseFloat(currentSavings),
      targetDate: new Date(targetDate),
      progress,
    });

    await goal.save();

    // Trigger notification generation on goal actions
    await generateSmartNotifications(req.user);

    res.status(201).json({ status: 'success', data: goal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error while creating goal' });
  }
};

exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user }).sort({ createdAt: -1 });
    const financials = await getUserFinancials(req.user);
    const userMonthlySavings = financials.monthlySavings;

    const calculatedGoals = goals.map((goal) => {
      const progress = Math.min(Math.round((goal.currentSavings / goal.targetAmount) * 100), 100);
      const monthsRemaining = (new Date(goal.targetDate) - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
      
      let monthlySavingsRequired = 0;
      if (progress < 100 && monthsRemaining > 0) {
        monthlySavingsRequired = (goal.targetAmount - goal.currentSavings) / monthsRemaining;
      }

      // Calculate probability
      let probability = 100;
      if (monthlySavingsRequired > 0) {
        if (userMonthlySavings >= monthlySavingsRequired * 1.2) {
          probability = 95;
        } else if (userMonthlySavings >= monthlySavingsRequired) {
          probability = 85;
        } else if (userMonthlySavings >= monthlySavingsRequired * 0.8) {
          probability = 70;
        } else if (userMonthlySavings >= monthlySavingsRequired * 0.5) {
          probability = 50;
        } else {
          probability = Math.max(Math.round((userMonthlySavings / monthlySavingsRequired) * 80), 15);
        }
      }

      return {
        _id: goal._id,
        goalName: goal.goalName,
        targetAmount: goal.targetAmount,
        currentSavings: goal.currentSavings,
        targetDate: goal.targetDate,
        progress,
        monthlySavingsRequired: Math.round(monthlySavingsRequired),
        probability,
      };
    });

    res.json({ status: 'success', data: calculatedGoals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error while fetching goals' });
  }
};

// ==========================================
// FEATURE 2: Trip Planner
// ==========================================

const DESTINATIONS = {
  paris: { name: 'Paris', dailyCost: 12000, flightCost: 65000 },
  tokyo: { name: 'Tokyo', dailyCost: 10000, flightCost: 55000 },
  goa: { name: 'Goa', dailyCost: 3000, flightCost: 8000 },
  newyork: { name: 'New York', dailyCost: 15000, flightCost: 75000 },
  bali: { name: 'Bali', dailyCost: 4000, flightCost: 25000 },
  london: { name: 'London', dailyCost: 13000, flightCost: 65000 },
};

exports.planTrip = async (req, res) => {
  try {
    const { destination, numberOfTravelers, startDate, endDate, budget } = req.body;
    if (!destination || !numberOfTravelers || !startDate || !endDate || budget === undefined) {
      return res.status(400).json({ status: 'error', message: 'All trip parameters are required' });
    }

    const travelers = parseInt(numberOfTravelers);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(Math.ceil((end - start) / (1000 * 60 * 60 * 24)), 1);

    // Cost estimation logic
    const destKey = destination.toLowerCase().replace(/\s+/g, '');
    const pricing = DESTINATIONS[destKey] || { name: destination, dailyCost: 6000, flightCost: 40000 };

    const estimatedCost = (travelers * pricing.dailyCost * days) + (pricing.flightCost * travelers);

    // Get available savings
    const financials = await getUserFinancials(req.user);
    const availableSavings = financials.monthlySavings * 6; // Assume 6 months of accumulated savings represents available budget, or fallback to goals

    const budgetRemaining = budget - estimatedCost;

    let recommendation = 'Not Recommended';
    if (estimatedCost <= budget && estimatedCost <= availableSavings) {
      recommendation = 'Safe To Travel';
    }

    // Suggest affordable options
    const affordableOptions = [];
    Object.keys(DESTINATIONS).forEach((key) => {
      const dest = DESTINATIONS[key];
      if (dest.name.toLowerCase() !== destination.toLowerCase()) {
        const optionCost = (travelers * dest.dailyCost * days) + (dest.flightCost * travelers);
        if (optionCost <= budget && optionCost <= availableSavings) {
          affordableOptions.push({
            destination: dest.name,
            estimatedCost: optionCost,
            savingsNeeded: optionCost,
          });
        }
      }
    });

    const trip = new Trip({
      userId: req.user,
      destination: pricing.name,
      budget: parseFloat(budget),
      estimatedCost,
      recommendation,
      numberOfTravelers: travelers,
      travelDates: `${startDate} to ${endDate}`,
    });

    await trip.save();

    res.json({
      status: 'success',
      data: {
        trip,
        estimatedCost,
        budgetRemaining,
        recommendation,
        availableSavings,
        days,
        affordableOptions,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during trip planning' });
  }
};

// ==========================================
// FEATURE 3: Debt Rescue Planner
// ==========================================

exports.analyzeDebt = async (req, res) => {
  try {
    const { totalDebt, emiAmount, monthlyIncome, monthlyExpenses } = req.body;
    if (totalDebt === undefined || emiAmount === undefined) {
      return res.status(400).json({ status: 'error', message: 'Total debt and EMI amount are required' });
    }

    // Fetch context fallback values if not provided
    const financials = await getUserFinancials(req.user);
    const income = parseFloat(monthlyIncome || financials.monthlyIncome);
    const expenses = parseFloat(monthlyExpenses || financials.monthlyExpenses);

    const dtiRatio = totalDebt / (income * 12 || 1);
    const emiRatio = emiAmount / (income || 1);

    // Risk Score: 60% EMI ratio + 40% DTI ratio
    const dtiScore = Math.min(dtiRatio, 2.0) / 2.0 * 100;
    const emiScore = emiRatio * 100;
    const debtRiskScore = Math.min(Math.round((emiScore * 0.6) + (dtiScore * 0.4)), 100);

    let category = 'Healthy';
    if (debtRiskScore >= 70 || emiRatio >= 0.45 || dtiRatio >= 1.5) {
      category = 'Critical';
    } else if (debtRiskScore >= 35 || emiRatio >= 0.25 || dtiRatio >= 0.7) {
      category = 'Moderate';
    }

    // Build Priority List
    const priorityList = [
      'Credit Card Debt (Avg interest: 36% - 40% p.a.) - Pay off first',
      'Personal Loan (Avg interest: 12% - 16% p.a.) - Pay off second',
      'Car Loan (Avg interest: 8% - 10% p.a.) - Pay off third',
      'Student Loan (Avg interest: 7% - 9% p.a.) - Pay off fourth',
      'Home Loan (Avg interest: 6% - 8% p.a.) - Pay off last'
    ];

    // Payoff Timeline
    const currentMonthsToPayoff = emiAmount > 0 ? Math.round(totalDebt / emiAmount) : 999;
    const extraAlloc = Math.max(income - expenses - emiAmount, 0) * 0.25; // Alloc 25% of savings
    const acceleratedEmi = emiAmount + extraAlloc;
    const acceleratedMonthsToPayoff = acceleratedEmi > 0 ? Math.round(totalDebt / acceleratedEmi) : 999;

    const repaymentPlan = `Under your current EMI of ₹${emiAmount.toLocaleString()}, it will take you ${currentMonthsToPayoff} months to clear your debt. By adopting the Debt Avalanche strategy and allocating 25% of your monthly savings (extra ₹${Math.round(extraAlloc).toLocaleString()}/month), you can accelerate your payoff to ${acceleratedMonthsToPayoff} months.`;

    const debtAnalysis = new DebtAnalysis({
      userId: req.user,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      totalDebt: parseFloat(totalDebt),
      emiAmount: parseFloat(emiAmount),
      debtRiskScore,
      category,
      priorityList,
      repaymentPlan,
    });

    await debtAnalysis.save();

    // Trigger notification check
    await generateSmartNotifications(req.user);

    res.json({
      status: 'success',
      data: debtAnalysis,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during debt analysis' });
  }
};

// ==========================================
// FEATURE 4: Subscription Analyzer
// ==========================================

const SUBSCRIPTION_PATTERNS = [
  { name: 'Netflix', regex: /netflix/i, cost: 499, category: 'Entertainment' },
  { name: 'Spotify', regex: /spotify/i, cost: 119, category: 'Entertainment' },
  { name: 'Amazon Prime', regex: /prime|amazon.*prime|prime.*video/i, cost: 299, category: 'Entertainment' },
  { name: 'Gym Membership', regex: /gym|fitness|gold.*gym/i, cost: 2000, category: 'Health' },
  { name: 'OTT Streaming', regex: /hotstar|hulu|hbo|disney|zee5|sony.*liv|apple.*tv/i, cost: 199, category: 'Entertainment' },
  { name: 'Cloud Services', regex: /aws|amazon.*web|google.*cloud|gcp|azure|digital.*ocean|heroku|github|vercel|netlify|dropbox|icloud|drive/i, cost: 1500, category: 'Utilities' },
];

exports.analyzeSubscriptions = async (req, res) => {
  try {
    const financials = await getUserFinancials(req.user);
    const transactions = financials.transactions.filter(t => t.type === 'Debit');

    const detected = [];
    const matchedNames = new Set();

    transactions.forEach((tx) => {
      SUBSCRIPTION_PATTERNS.forEach((sub) => {
        if (sub.regex.test(tx.description) && !matchedNames.has(sub.name)) {
          detected.push({
            name: sub.name,
            category: sub.category,
            monthlyCost: tx.amount || sub.cost,
            lastPaymentDate: tx.date,
          });
          matchedNames.add(sub.name);
        }
      });
    });

    // Fallback: If user uploaded nothing, show a couple of simulated subscriptions for preview
    if (detected.length === 0) {
      detected.push(
        { name: 'Netflix', category: 'Entertainment', monthlyCost: 499, lastPaymentDate: new Date() },
        { name: 'Spotify', category: 'Entertainment', monthlyCost: 119, lastPaymentDate: new Date() },
        { name: 'Gym Membership', category: 'Health', monthlyCost: 1500, lastPaymentDate: new Date() }
      );
    }

    const monthlyCost = detected.reduce((sum, item) => sum + item.monthlyCost, 0);
    const yearlyCost = monthlyCost * 12;

    // Discretionary entertainment subscriptions can be optimized/cancelled
    const possibleSavings = detected
      .filter(item => item.category === 'Entertainment')
      .reduce((sum, item) => sum + item.monthlyCost, 0);

    res.json({
      status: 'success',
      data: {
        subscriptions: detected,
        monthlySubscriptionCost: monthlyCost,
        yearlySubscriptionCost: yearlyCost,
        possibleSavings,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during subscription analysis' });
  }
};

// ==========================================
// FEATURE 5: Retirement Planner (Proxy to FastAPI)
// ==========================================

exports.calculateRetirement = async (req, res) => {
  try {
    const { currentAge, retirementAge, currentSavings, monthlyInvestment, monthlyExpenses } = req.body;
    if (currentAge === undefined || retirementAge === undefined || currentSavings === undefined || monthlyInvestment === undefined) {
      return res.status(400).json({ status: 'error', message: 'All retirement planning parameters are required' });
    }

    const financials = await getUserFinancials(req.user);
    const expenses = monthlyExpenses || financials.monthlyExpenses || 30000;

    // Proxy request to FastAPI AI service
    const response = await fetch(`${AI_SERVICE_URL}/retirement-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_age: parseInt(currentAge),
        retirement_age: parseInt(retirementAge),
        current_savings: parseFloat(currentSavings),
        monthly_investment: parseFloat(monthlyInvestment),
        monthly_expenses: parseFloat(expenses),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Service Error: ${errorText}` });
    }

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during retirement planning' });
  }
};

// ==========================================
// FEATURE 6: Emergency Fund Calculator
// ==========================================

exports.calculateEmergencyFund = async (req, res) => {
  try {
    const financials = await getUserFinancials(req.user);
    const monthlyExpenses = financials.monthlyExpenses > 0 ? financials.monthlyExpenses : 30000;

    // Sum up savings in goals
    const goals = await Goal.find({ userId: req.user });
    const currentSavings = goals.reduce((sum, g) => sum + g.currentSavings, 0) || financials.monthlySavings * 4;

    const fund3Month = monthlyExpenses * 3;
    const fund6Month = monthlyExpenses * 6;
    const fund12Month = monthlyExpenses * 12;

    const currentEmergencyReadiness = Math.min(Math.round((currentSavings / fund6Month) * 100), 100);

    res.json({
      status: 'success',
      data: {
        monthlyExpenses: Math.round(monthlyExpenses),
        fund3Month: Math.round(fund3Month),
        fund6Month: Math.round(fund6Month),
        fund12Month: Math.round(fund12Month),
        currentSavings: Math.round(currentSavings),
        currentEmergencyReadiness,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during emergency fund calculations' });
  }
};

// ==========================================
// FEATURE 7: Spending Insights (Proxy to FastAPI)
// ==========================================

exports.getSpendingInsights = async (req, res) => {
  try {
    const financials = await getUserFinancials(req.user);
    
    // Prepare transaction payload for pandas EDA
    const transactionsPayload = financials.transactions.map(t => ({
      date: t.date,
      description: t.description,
      category: t.category,
      amount: t.amount,
      type: t.type
    }));

    const response = await fetch(`${AI_SERVICE_URL}/spending-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: transactionsPayload
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Service Error: ${errorText}` });
    }

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during spending insights' });
  }
};

// ==========================================
// FEATURE 8: Financial Forecast (Proxy to FastAPI)
// ==========================================

exports.getForecast = async (req, res) => {
  try {
    const financials = await getUserFinancials(req.user);

    const transactionsPayload = financials.transactions.map(t => ({
      date: t.date,
      description: t.description,
      category: t.category,
      amount: t.amount,
      type: t.type
    }));

    const response = await fetch(`${AI_SERVICE_URL}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: transactionsPayload,
        monthly_income: financials.monthlyIncome
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Service Error: ${errorText}` });
    }

    const result = await response.json();

    // Save forecast to DB
    const forecastSavings = new Forecast({
      userId: req.user,
      forecastType: 'Savings',
      predicted3M: result.savings_forecast['3M'],
      predicted6M: result.savings_forecast['6M'],
      predicted12M: result.savings_forecast['12M'],
    });
    await forecastSavings.save();

    const forecastExpenses = new Forecast({
      userId: req.user,
      forecastType: 'Expenses',
      predicted3M: result.expenses_forecast['3M'],
      predicted6M: result.expenses_forecast['6M'],
      predicted12M: result.expenses_forecast['12M'],
    });
    await forecastExpenses.save();

    res.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during forecasting' });
  }
};

// ==========================================
// FEATURE 9: Smart Notifications
// ==========================================

const generateSmartNotifications = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const financials = await getUserFinancials(userId);
    const { monthlyIncome, monthlyExpenses, monthlySavings, emiAmount, transactions } = financials;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Helper: Check if duplicate unread notification exists
    const hasNotification = async (type) => {
      const count = await Notification.countDocuments({
        userId,
        type,
        status: 'unread',
        createdAt: { $gte: oneWeekAgo }
      });
      return count > 0;
    };

    // 1. High spending alert
    const spendingRatio = monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 0;
    if (spendingRatio > 0.70) {
      const type = 'high_spending';
      if (!(await hasNotification(type))) {
        const notif = new Notification({
          userId,
          type,
          message: `High Spending: You spent ₹${Math.round(monthlyExpenses).toLocaleString()} this month, which is ${Math.round(spendingRatio * 100)}% of your income.`,
        });
        await notif.save();
      }
    }

    // 2. EMI Overload alert
    const emiRatio = monthlyIncome > 0 ? emiAmount / monthlyIncome : 0;
    if (emiRatio > 0.40) {
      const type = 'emi_overload';
      if (!(await hasNotification(type))) {
        const notif = new Notification({
          userId,
          type,
          message: `EMI Overload: Your monthly debt/EMI payments total ₹${Math.round(emiAmount).toLocaleString()} (${Math.round(emiRatio * 100)}% of your income). Focus on repayment plans.`,
        });
        await notif.save();
      }
    }

    // 3. Goal off track alert
    const goals = await Goal.find({ userId });
    for (const goal of goals) {
      const progress = Math.min(Math.round((goal.currentSavings / goal.targetAmount) * 100), 100);
      const monthsRemaining = (new Date(goal.targetDate) - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
      
      let monthlySavingsRequired = 0;
      if (progress < 100 && monthsRemaining > 0) {
        monthlySavingsRequired = (goal.targetAmount - goal.currentSavings) / monthsRemaining;
      }

      if (monthlySavingsRequired > monthlySavings && progress < 100) {
        const type = `goal_off_track_${goal._id}`;
        if (!(await hasNotification(type))) {
          const notif = new Notification({
            userId,
            type,
            message: `Goal Off Track: Your goal '${goal.goalName}' needs ₹${Math.round(monthlySavingsRequired).toLocaleString()}/month, but your current monthly savings rate is ₹${Math.round(monthlySavings).toLocaleString()}/month.`,
          });
          await notif.save();
        }
      }
    }

    // 4. Savings dropping alert
    // If transactions span at least two months
    if (transactions.length > 5) {
      // Group by month
      const monthlyData = {};
      transactions.forEach((tx) => {
        const monthKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { inc: 0, exp: 0 };
        if (tx.type === 'Credit') monthlyData[monthKey].inc += tx.amount;
        else monthlyData[monthKey].exp += tx.amount;
      });

      const sortedMonths = Object.keys(monthlyData).sort();
      if (sortedMonths.length >= 2) {
        const latestMonth = sortedMonths[sortedMonths.length - 1];
        const prevMonth = sortedMonths[sortedMonths.length - 2];
        const latestSavings = Math.max(monthlyData[latestMonth].inc - monthlyData[latestMonth].exp, 0);
        const prevSavings = Math.max(monthlyData[prevMonth].inc - monthlyData[prevMonth].exp, 0);

        if (prevSavings > 0 && latestSavings < prevSavings * 0.85) {
          const dropPct = Math.round(((prevSavings - latestSavings) / prevSavings) * 100);
          const type = 'savings_dropping';
          if (!(await hasNotification(type))) {
            const notif = new Notification({
              userId,
              type,
              message: `Savings Dropping: Your monthly savings dropped by ${dropPct}% (from ₹${Math.round(prevSavings).toLocaleString()} to ₹${Math.round(latestSavings).toLocaleString()}) compared to last month.`,
            });
            await notif.save();
          }
        }
      }
    }
  } catch (err) {
    console.error('Error generating notifications:', err);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    // Generate alerts dynamically first
    await generateSmartNotifications(req.user);

    const notifications = await Notification.find({ userId: req.user }).sort({ createdAt: -1 }).limit(30);
    res.json({
      status: 'success',
      data: notifications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error fetching notifications' });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user, status: 'unread' }, { status: 'read' });
    res.json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error updating notifications' });
  }
};

// ==========================================
// FEATURE 10: AI Recommendation Engine
// ==========================================

exports.getRecommendations = async (req, res) => {
  try {
    const financials = await getUserFinancials(req.user);
    const { monthlyIncome, monthlySavings, emiAmount, categoryTotals } = financials;

    const recommendations = [];

    // 1. Debt Recommendation
    const emiRatio = emiAmount / (monthlyIncome || 1);
    if (emiRatio > 0.3) {
      recommendations.push('Pay High-Interest Debt first. Focus extra payments on credit card and personal loan balances to reduce EMI ratio.');
    }

    // 2. Emergency Fund Recommendation
    // Calculate emergency fund readiness
    const monthlyExpenses = financials.monthlyExpenses > 0 ? financials.monthlyExpenses : 30000;
    const goals = await Goal.find({ userId: req.user });
    const currentSavings = goals.reduce((sum, g) => sum + g.currentSavings, 0) || monthlySavings * 4;
    const target6M = monthlyExpenses * 6;
    if (currentSavings < target6M) {
      recommendations.push(`Build Emergency Fund: Open a high-yield savings account and set aside ₹${Math.round(target6M - currentSavings).toLocaleString()} more to cover 6 months of expenses.`);
    }

    // 3. Investment recommendation
    const savingsRatio = monthlySavings / (monthlyIncome || 1);
    if (savingsRatio >= 0.25) {
      recommendations.push(`Increase SIP (Systematic Investment Plan) contributions. Since your savings ratio is a healthy ${Math.round(savingsRatio * 100)}%, automate your investments into long-term equity index funds.`);
    } else {
      recommendations.push('Create a monthly budget constraint to raise your savings ratio above 25% by cutting non-essential entertainment subscription costs.');
    }

    // 4. Spending Insights
    let highestCat = '';
    let maxCatAmt = 0;
    Object.keys(categoryTotals).forEach((cat) => {
      if (categoryTotals[cat] > maxCatAmt && cat.toLowerCase() !== 'other') {
        maxCatAmt = categoryTotals[cat];
        highestCat = cat;
      }
    });

    if (highestCat && maxCatAmt > monthlyIncome * 0.2) {
      recommendations.push(`Reduce spending on ${highestCat}. You spent a high ₹${Math.round(maxCatAmt).toLocaleString()} on this category, try cutting discretionary items.`);
    }

    // Default recommendation if list is too small
    if (recommendations.length < 2) {
      recommendations.push('Review your investment options periodically in our Investments tab based on your changing risk profile.');
      recommendations.push('Keep track of goals monthly to maintain consistent savings deposits.');
    }

    // Store recommendation history
    const history = new RecommendationHistory({
      userId: req.user,
      recommendations,
    });
    await history.save();

    res.json({
      status: 'success',
      data: {
        recommendations,
        historyId: history._id,
        createdAt: history.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error fetching recommendations' });
  }
};
