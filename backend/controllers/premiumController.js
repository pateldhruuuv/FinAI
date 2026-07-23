const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const TaxAnalysis = require('../models/TaxAnalysis');
const Loans = require('../models/Loans');
const PurchaseHistory = require('../models/PurchaseHistory');
const Portfolio = require('../models/Portfolio');
const FinancialTwin = require('../models/FinancialTwin');
const Reports = require('../models/Reports');
const PremiumRecommendations = require('../models/PremiumRecommendations');

const PDFDocument = require('pdfkit');

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
- You must ONLY answer questions regarding the user's financial details, portfolios, goals, tax optimization, loan eligibility, debt rescue, and purchase affordability in this app.
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

// Helper to calculate user financials from transaction history
const getUserFinancialContext = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const transactions = await Transaction.find({ userId });
  let totalIncome = 0;
  let totalExpenses = 0;
  let debt = 0;
  const categories = {};

  transactions.forEach((tx) => {
    if (tx.type === 'Credit') {
      totalIncome += tx.amount;
    } else {
      totalExpenses += tx.amount;
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
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
    categories,
    user,
  };
};

// FEATURE 1: Tax Optimization Advisor
exports.getTaxOptimization = async (req, res) => {
  try {
    const {
      annualIncome,
      salaryStructure,
      deductions80C,
      deductions80D,
      homeLoan,
      educationLoan,
      rentPaid,
    } = req.body;

    if (annualIncome === undefined) {
      return res.status(400).json({ status: 'error', message: 'Annual Income is required' });
    }

    const basic = salaryStructure?.basic || annualIncome * 0.40; // assume 40% basic if not structured
    const hra = salaryStructure?.hra || annualIncome * 0.15;
    const special = salaryStructure?.specialAllowance || 0;
    const other = salaryStructure?.other || 0;

    // Call Python FastAPI
    const response = await fetch(`${AI_SERVICE_URL}/tax-optimizer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        annual_income: parseFloat(annualIncome),
        salary_basic: parseFloat(basic),
        salary_hra: parseFloat(hra),
        salary_special: parseFloat(special),
        salary_other: parseFloat(other),
        deductions_80c: parseFloat(deductions80C || 0),
        deductions_80d: parseFloat(deductions80D || 0),
        home_loan: parseFloat(homeLoan || 0),
        education_loan: parseFloat(educationLoan || 0),
        rent_paid: parseFloat(rentPaid || 0),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Service Error: ${errText}` });
    }

    const result = await response.json();

    // Save to Database
    const taxAnalysis = new TaxAnalysis({
      userId: req.user,
      annualIncome,
      salaryStructure: { basic, hra, specialAllowance: special, other },
      deductions80C: deductions80C || 0,
      deductions80D: deductions80D || 0,
      homeLoanInterest: homeLoan || 0,
      educationLoanInterest: educationLoan || 0,
      rentPaid: rentPaid || 0,
      taxableIncome: result.taxable_income,
      currentTax: result.old_tax,
      potentialSavings: result.potential_savings,
      recommendedInvestments: result.recommended_investments,
      taxBreakdownChart: result.tax_breakdown_chart,
    });
    await taxAnalysis.save();

    // Update Centralized recommendations
    await PremiumRecommendations.findOneAndUpdate(
      { userId: req.user },
      {
        taxAdvice: `Potential tax savings: ₹${result.potential_savings.toLocaleString()}. Suggestions: ${result.suggestions.join(' ')}`,
        updatedAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    res.json({
      status: 'success',
      data: {
        taxableIncome: result.taxable_income,
        oldTax: result.old_tax,
        newTax: result.new_tax,
        potentialSavings: result.potential_savings,
        suggestions: result.suggestions,
        recommendedInvestments: result.recommended_investments,
        taxBreakdownChart: result.tax_breakdown_chart,
        id: taxAnalysis._id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error during tax analysis' });
  }
};

// FEATURE 2: Loan Eligibility Advisor
exports.getLoanAdvice = async (req, res) => {
  try {
    const { income, age, creditScore, currentEmi, existingLoans } = req.body;
    const context = await getUserFinancialContext(req.user);

    const inputIncome = income !== undefined ? parseFloat(income) : (context.income || context.user.monthlyIncome);
    const inputAge = age !== undefined ? parseInt(age) : context.age;

    // Call Python FastAPI
    const response = await fetch(`${AI_SERVICE_URL}/loan-advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        income: inputIncome,
        age: inputAge,
        credit_score: creditScore !== undefined ? parseInt(creditScore) : 750,
        current_emi: parseFloat(currentEmi || 0),
        existing_loans: parseFloat(existingLoans || 0),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Service Error: ${errText}` });
    }

    const result = await response.json();

    // Save to Database
    const loanRecord = new Loans({
      userId: req.user,
      income: inputIncome,
      age: inputAge,
      creditScore: creditScore || 750,
      currentEmi: currentEmi || 0,
      existingLoans: existingLoans || 0,
      eligibleAmount: result.eligible_amount,
      maximumEmi: result.maximum_emi,
      safeEmi: result.safe_emi,
      loanRisk: result.loan_risk,
      breakdown: result.breakdown,
    });
    await loanRecord.save();

    // Update Centralized recommendations
    await PremiumRecommendations.findOneAndUpdate(
      { userId: req.user },
      {
        debtAdvice: `Loan Risk Profile: ${result.loan_risk}. Safe Monthly EMI budget: ₹${result.safe_emi.toLocaleString()}. Eligible Home Loan limit: ₹${result.eligible_amount.toLocaleString()}.`,
        updatedAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    res.json({
      status: 'success',
      data: {
        eligibleAmount: result.eligible_amount,
        maximumEmi: result.maximum_emi,
        safeEmi: result.safe_emi,
        loanRisk: result.loan_risk,
        breakdown: result.breakdown,
        id: loanRecord._id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error during loan analysis' });
  }
};

// FEATURE 3: Insurance Gap Analysis
exports.getInsuranceGapAnalysis = async (req, res) => {
  try {
    const { existingPolicies, coverageAmount, dependents, income } = req.body;
    const context = await getUserFinancialContext(req.user);

    const inputIncome = income !== undefined ? parseFloat(income) : (context.income * 12);
    const inputCoverage = coverageAmount !== undefined ? parseFloat(coverageAmount) : 0;
    const inputDependents = dependents !== undefined ? parseInt(dependents) : 0;

    // Call Python FastAPI
    const response = await fetch(`${AI_SERVICE_URL}/insurance-gap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_coverage: inputCoverage,
        dependents: inputDependents,
        income: inputIncome,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Service Error: ${errText}` });
    }

    const result = await response.json();

    // Update Centralized recommendations
    await PremiumRecommendations.findOneAndUpdate(
      { userId: req.user },
      {
        insuranceAdvice: `Insurance Gap Identified: ₹${result.coverage_gap.toLocaleString()}. Recommended Type: ${result.best_insurance_type} (Priority: ${result.priority_level}).`,
        updatedAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    res.json({
      status: 'success',
      data: {
        requiredCoverage: result.required_coverage,
        coverageGap: result.coverage_gap,
        recommendedAdditionalCoverage: result.recommended_additional_coverage,
        bestInsuranceType: result.best_insurance_type,
        priorityLevel: result.priority_level,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error during insurance gap analysis' });
  }
};

// FEATURE 4: Purchase Advisor
exports.getPurchaseAdvice = async (req, res) => {
  try {
    const { item, cost } = req.body;
    if (!item || cost === undefined) {
      return res.status(400).json({ status: 'error', message: 'Item name and cost are required' });
    }

    const context = await getUserFinancialContext(req.user);
    const goals = await Goal.find({ userId: req.user });
    const goalsTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const portfolio = await Portfolio.findOne({ userId: req.user });
    
    // Accumulate total investments
    const totalInvestments = portfolio
      ? (portfolio.stocks + portfolio.mutualFunds + portfolio.gold + portfolio.fd + portfolio.crypto + portfolio.property)
      : 0;

    // Call Python FastAPI
    const response = await fetch(`${AI_SERVICE_URL}/purchase-advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item,
        cost: parseFloat(cost),
        income: context.income,
        savings: context.savings + totalInvestments, // Liquid + investments
        goals_target: goalsTarget,
        debt: context.debt,
        emergency_fund: context.expenses * 3, // assume emergency fund target is 3 months expenses
        investments: totalInvestments,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Service Error: ${errText}` });
    }

    const result = await response.json();

    // Save to Database
    const purchase = new PurchaseHistory({
      userId: req.user,
      item,
      cost: parseFloat(cost),
      purchaseScore: result.purchase_score,
      status: result.status_recommendation,
      suggestions: {
        refurbishedOption: result.suggestions.refurbishedOption,
        emiOption: result.suggestions.emiOption,
        secondHandOption: result.suggestions.secondHandOption,
        betterAlternative: result.suggestions.betterAlternative,
      },
    });
    await purchase.save();

    // Update Centralized recommendations
    await PremiumRecommendations.findOneAndUpdate(
      { userId: req.user },
      {
        purchaseAdvice: `Buying ${item} (₹${cost.toLocaleString()}): Decision is ${result.status_recommendation} (Score: ${result.purchase_score}/100). Alternative: ${result.suggestions.betterAlternative}`,
        updatedAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    res.json({
      status: 'success',
      data: {
        purchaseScore: result.purchase_score,
        status: result.status_recommendation,
        suggestions: result.suggestions,
        id: purchase._id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error during purchase advisory' });
  }
};

// FEATURE 5: What-If Simulator
exports.runWhatIfSimulation = async (req, res) => {
  try {
    const { scenario, value } = req.body;
    if (!scenario || value === undefined) {
      return res.status(400).json({ status: 'error', message: 'Scenario name and value are required' });
    }

    const context = await getUserFinancialContext(req.user);
    const goals = await Goal.find({ userId: req.user });
    
    const inputGoals = goals.map(g => ({
      goalName: g.goalName,
      targetAmount: g.targetAmount,
      currentSavings: g.currentSavings,
    }));

    // Call Python FastAPI
    const response = await fetch(`${AI_SERVICE_URL}/what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario,
        value: parseFloat(value),
        current_savings: context.savings,
        current_income: context.income,
        current_expenses: context.expenses,
        current_debt: context.debt,
        goals: inputGoals,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Service Error: ${errText}` });
    }

    const result = await response.json();

    res.json({
      status: 'success',
      data: {
        futureSavings: result.future_savings,
        debt: result.debt,
        goalDelayMonths: result.goal_delay_months,
        investmentImpact: result.investment_impact,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error in What-If Simulator' });
  }
};

// FEATURE 6: Portfolio Risk Analyzer
exports.getPortfolioRiskAnalysis = async (req, res) => {
  try {
    const { stocks, mutualFunds, gold, fd, crypto, property } = req.body;

    // Call Python FastAPI
    const response = await fetch(`${AI_SERVICE_URL}/portfolio-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stocks: parseFloat(stocks || 0),
        mutual_funds: parseFloat(mutualFunds || 0),
        gold: parseFloat(gold || 0),
        fd: parseFloat(fd || 0),
        crypto: parseFloat(crypto || 0),
        property: parseFloat(property || 0),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Service Error: ${errText}` });
    }

    const result = await response.json();

    // Save to Database
    const portfolioRecord = await Portfolio.findOneAndUpdate(
      { userId: req.user },
      {
        stocks: parseFloat(stocks || 0),
        mutualFunds: parseFloat(mutualFunds || 0),
        gold: parseFloat(gold || 0),
        fd: parseFloat(fd || 0),
        crypto: parseFloat(crypto || 0),
        property: parseFloat(property || 0),
        riskScore: result.risk_score,
        diversification: result.diversification,
        safeAllocation: result.safe_allocation,
        recommendations: result.recommendations,
        highRiskAssets: result.high_risk_assets,
        portfolioChart: result.portfolio_chart,
        createdAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    // Update Centralized recommendations
    await PremiumRecommendations.findOneAndUpdate(
      { userId: req.user },
      {
        investmentAdvice: `Portfolio Risk Score: ${result.risk_score}/100. Diversification: ${result.diversification}. Suggestion: ${result.recommendations[0]}`,
        updatedAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    res.json({
      status: 'success',
      data: {
        diversification: result.diversification,
        riskScore: result.risk_score,
        safeAllocation: result.safe_allocation,
        highRiskAssets: result.high_risk_assets,
        recommendations: result.recommendations,
        portfolioChart: result.portfolio_chart,
        id: portfolioRecord._id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error during portfolio analysis' });
  }
};

// FEATURE 7: AI Financial Coach
exports.getFinancialCoachAdvice = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ status: 'error', message: 'Question is required' });
    }

    const context = await getUserFinancialContext(req.user);
    const goals = await Goal.find({ userId: req.user });
    const portfolio = await Portfolio.findOne({ userId: req.user });

    const inputGoals = goals.map(g => ({
      goalName: g.goalName,
      targetAmount: g.targetAmount,
      currentSavings: g.currentSavings,
    }));

    const portfolioData = portfolio
      ? {
          stocks: portfolio.stocks,
          mutual_funds: portfolio.mutualFunds,
          gold: portfolio.gold,
          fd: portfolio.fd,
          crypto: portfolio.crypto,
          property: portfolio.property,
        }
      : {};

    // 1. Call Python FastAPI first to run the advisor method
    let reply = "I'm sorry, I could not calculate a response right now.";
    try {
      const response = await fetch(`${AI_SERVICE_URL}/financial-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          age: context.age || 30,
          income: context.income || 50000,
          expenses: context.expenses || 0,
          savings: context.savings || 0,
          debt: context.debt || 0,
          goals: inputGoals,
          investments: portfolioData,
          insurance: {
            current_coverage: 1000000,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        reply = result.reply;
      }
    } catch (err) {
      console.warn("Failed to contact FastAPI advisor server:", err.message);
    }

    // 2. Try to rephrase nicely using Gemini if API key is configured
    if (process.env.GEMINI_API_KEY) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

      try {
        const prompt = buildChatPrompt({
          message: question.trim(),
          context,
          history: [],
          advisorContext: `[Advisory Calculation - Financial Coach Advice]: ${reply}`,
        });

        const geminiResponse = await fetch(GEMINI_API_URL, {
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

        if (geminiResponse.ok) {
          const geminiResult = await geminiResponse.json();
          reply = extractGeminiReply(geminiResult);
        }
      } catch (geminiErr) {
        clearTimeout(timeoutId);
        console.warn("Gemini rephrasing failed; returning raw Python advice. Error:", geminiErr.message);
      }
    }

    res.json({
      status: 'success',
      reply,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error in AI financial coach' });
  }
};

// FEATURE 10: Financial Reports
exports.generateFinancialReport = async (req, res) => {
  try {
    const { reportType, format } = req.body;
    if (!reportType || !format) {
      return res.status(400).json({ status: 'error', message: 'Report type (Monthly, Quarterly, Yearly) and format (PDF, CSV) are required' });
    }

    const context = await getUserFinancialContext(req.user);
    const portfolio = await Portfolio.findOne({ userId: req.user });
    const goals = await Goal.find({ userId: req.user });
    const recommendations = await PremiumRecommendations.findOne({ userId: req.user });

    const totalInvestments = portfolio
      ? (portfolio.stocks + portfolio.mutualFunds + portfolio.gold + portfolio.fd + portfolio.crypto + portfolio.property)
      : 0;

    // Calculate a basic health score (same logic as dashboard)
    const incomeBase = context.income;
    const savingsRatio = incomeBase > 0 ? context.savings / incomeBase : 0;
    const debtRatio = incomeBase > 0 ? context.debt / incomeBase : 0;
    const emergencyFund = context.expenses > 0 ? context.savings / context.expenses : 0;

    let savingsScore = savingsRatio >= 0.3 ? 40 : (savingsRatio >= 0.1 ? 20 : 5);
    let debtScore = debtRatio <= 0.1 ? 30 : (debtRatio <= 0.3 ? 20 : (debtRatio <= 0.5 ? 10 : 0));
    let emergencyScore = emergencyFund >= 3 ? 30 : (emergencyFund >= 1.5 ? 20 : (emergencyFund >= 0.5 ? 10 : 0));
    const healthScore = savingsScore + debtScore + emergencyScore;

    // Generate recommendation strings
    const adviceList = [];
    if (recommendations) {
      if (recommendations.investmentAdvice) adviceList.push(recommendations.investmentAdvice);
      if (recommendations.taxAdvice) adviceList.push(recommendations.taxAdvice);
      if (recommendations.insuranceAdvice) adviceList.push(recommendations.insuranceAdvice);
      if (recommendations.debtAdvice) adviceList.push(recommendations.debtAdvice);
    }
    if (adviceList.length === 0) {
      adviceList.push("Maintain a savings ratio above 20%. Allocate liquid savings to diversified mutual funds.");
      adviceList.push("Clear outstanding high-interest credit card debt or personal loans.");
    }

    // Save to Database
    const reportRecord = new Reports({
      userId: req.user,
      reportType,
      fileFormat: format,
      summary: {
        income: incomeBase,
        expenses: context.expenses,
        savings: context.savings,
        healthScore,
        debt: context.debt,
      },
      recommendations: adviceList,
    });
    await reportRecord.save();

    // Return files
    if (format.toUpperCase() === 'CSV') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=FinPilot_${reportType}_Report.csv`);

      let csvContent = 'Metric,Value\n';
      csvContent += `Report Type,${reportType}\n`;
      csvContent += `Generated Date,${new Date().toLocaleDateString()}\n`;
      csvContent += `User,${context.user.name}\n`;
      csvContent += `Monthly Income Base,₹${incomeBase}\n`;
      csvContent += `Monthly Expenses,₹${context.expenses}\n`;
      csvContent += `Monthly Savings,₹${context.savings}\n`;
      csvContent += `Outstanding Debt / EMIs,₹${context.debt}\n`;
      csvContent += `Financial Health Score,${healthScore} / 100\n`;
      csvContent += `Total Portfolio Assets,₹${totalInvestments}\n`;
      csvContent += '\nRecommendations:\n';
      adviceList.forEach((adv, i) => {
        csvContent += `Suggestion ${i+1},"${adv.replace(/"/g, '""')}"\n`;
      });

      return res.status(200).send(csvContent);
    } else {
      // PDF format using pdfkit
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=FinPilot_${reportType}_Report.pdf`);

      doc.pipe(res);

      // Header Banner
      doc.rect(0, 0, 612, 100).fill('#1e1b4b');
      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('FinPilot AI', 50, 30);
      doc.fontSize(12).font('Helvetica').text('Premium Financial Performance Report', 50, 60);

      // Metas
      doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(`Client Statement Overview: ${reportType}`, 50, 130);
      doc.fontSize(10).font('Helvetica')
         .text(`Prepared For: ${context.user.name}`, 50, 155)
         .text(`Email: ${context.user.email}`, 50, 170)
         .text(`Report Period: ${new Date().toLocaleDateString()} (Auto-compiled)`, 50, 185);

      // Divider line
      doc.moveTo(50, 210).lineTo(560, 210).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // Key metrics
      doc.fontSize(14).font('Helvetica-Bold').text('Core Metrics Summary', 50, 230);
      doc.fontSize(11).font('Helvetica')
         .text(`Monthly Income: INR ${incomeBase.toLocaleString()}`, 50, 255)
         .text(`Monthly Expenses: INR ${context.expenses.toLocaleString()}`, 50, 275)
         .text(`Monthly Savings Net: INR ${context.savings.toLocaleString()}`, 50, 295)
         .text(`Debt EMI Burden: INR ${context.debt.toLocaleString()}`, 300, 255)
         .text(`Accumulated Investments: INR ${totalInvestments.toLocaleString()}`, 300, 275)
         .text(`Financial Health Index: ${healthScore} / 100`, 300, 295);

      // Health Index Status Block
      const statusText = healthScore >= 80 ? 'EXCELLENT' : (healthScore >= 60 ? 'HEALTHY / GOOD' : 'MODERATE / ACTION REQUIRED');
      doc.rect(50, 330, 512, 45).fill('#f3f4f6');
      doc.fillColor('#1e1b4b').fontSize(11).font('Helvetica-Bold').text(`FINANCIAL HEALTH STATUS: ${statusText}`, 65, 347);

      // Advice section
      doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text('AI Generated Advisory Recommendations', 50, 400);
      
      let verticalOffset = 425;
      adviceList.forEach((adv, i) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`• Suggestion #${i+1}: `, 50, verticalOffset);
        doc.font('Helvetica').text(adv, 140, verticalOffset, { width: 420 });
        verticalOffset += doc.heightOfString(adv, { width: 420 }) + 15;
      });

      // Footer
      doc.moveTo(50, 720).lineTo(560, 720).strokeColor('#e5e7eb').stroke();
      doc.fontSize(8).font('Helvetica-Oblique').text('FinPilot AI is a premium robo-advisory utility. Past returns do not guarantee future performance.', 50, 735, { align: 'center', width: 512 });

      doc.end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error compiling financial report' });
  }
};

// FEATURE 11: Premium Dashboard & Digital Twin
exports.getPremiumDashboardData = async (req, res) => {
  try {
    const context = await getUserFinancialContext(req.user);
    const portfolio = await Portfolio.findOne({ userId: req.user });
    const goals = await Goal.find({ userId: req.user });
    const tax = await TaxAnalysis.findOne({ userId: req.user }).sort({ createdAt: -1 });
    const loan = await Loans.findOne({ userId: req.user }).sort({ createdAt: -1 });
    const purchase = await PurchaseHistory.findOne({ userId: req.user }).sort({ createdAt: -1 });

    const totalInvestments = portfolio
      ? (portfolio.stocks + portfolio.mutualFunds + portfolio.gold + portfolio.fd + portfolio.crypto + portfolio.property)
      : 0;

    const netWorth = context.savings + totalInvestments - (loan?.existingLoans || context.debt * 12);

    // Calculate goals list target
    const inputGoals = goals.map(g => ({
      name: g.goalName,
      progress: g.progress || 0,
    }));

    // Create Net Worth History for trend chart (past 6 months estimation based on historical savings)
    const nwHistory = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      nwHistory.push({
        month: months[idx],
        assets: context.savings + totalInvestments - (context.savings * i * 0.15),
        liabilities: (loan?.existingLoans || context.debt * 12) * (1 - i * 0.05),
      });
    }

    // Call Python FastAPI to render the 7 dashboard charts
    const response = await fetch(`${AI_SERVICE_URL}/premium-dashboard-plots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolio: portfolio
          ? {
              stocks: portfolio.stocks,
              mutual_funds: portfolio.mutualFunds,
              gold: portfolio.gold,
              fd: portfolio.fd,
              crypto: portfolio.crypto,
              property: portfolio.property,
            }
          : { stocks: 0, mutual_funds: 0, gold: 0, fd: 0, crypto: 0, property: 0 },
        net_worth_history: nwHistory,
        tax: tax
          ? { old_tax: tax.currentTax, new_tax: tax.currentTax * 0.9, optimized_tax: tax.currentTax - tax.potentialSavings }
          : { old_tax: 0, new_tax: 0, optimized_tax: 0 },
        goals: inputGoals,
        investments: portfolio
          ? { stocks: portfolio.stocks, mutual_funds: portfolio.mutualFunds, gold: portfolio.gold, fd: portfolio.fd, crypto: portfolio.crypto, property: portfolio.property }
          : { stocks: 0, mutual_funds: 0, gold: 0, fd: 0, crypto: 0, property: 0 },
        debt: {
          monthly_income: context.income,
          current_emi: context.debt,
          other_debts: loan?.existingLoans || context.debt * 12,
        },
        forecast: {
          historical_expenses: [context.expenses * 0.9, context.expenses * 0.95, context.expenses],
          historical_savings: [context.savings * 0.8, context.savings * 0.9, context.savings],
        },
      }),
    });

    let plots = {};
    if (response.ok) {
      const plotResult = await response.json();
      plots = plotResult.plots;
    } else {
      console.warn("Python plot generation failed");
    }

    // FEATURE 8: Financial Digital Twin calculations
    // Financial Age
    const debtRatio = context.income > 0 ? context.debt / context.income : 0;
    const savingsRatio = context.income > 0 ? context.savings / context.income : 0;
    
    let ageModifier = 0;
    if (debtRatio > 0.40) ageModifier += 5;
    else if (debtRatio < 0.15) ageModifier -= 2;

    if (savingsRatio < 0.10) ageModifier += 4;
    else if (savingsRatio > 0.35) ageModifier -= 3;

    const financialAge = Math.max(context.age + ageModifier, 18);

    // Savings Personality
    let savingsPersonality = 'Balanced Budgeter';
    if (savingsRatio >= 0.35) savingsPersonality = 'Zen Accumulator';
    else if (savingsRatio < 0.10) savingsPersonality = 'Carefree Splurger';

    // Investment Personality
    let investmentPersonality = 'Moderate Rebalancer';
    if (portfolio) {
      const totalP = portfolio.stocks + portfolio.mutualFunds + portfolio.gold + portfolio.fd + portfolio.crypto + portfolio.property;
      if (totalP > 0) {
        const conservativeShare = (portfolio.fd + portfolio.gold) / totalP;
        const aggressiveShare = (portfolio.stocks + portfolio.crypto) / totalP;
        if (aggressiveShare > 0.60) investmentPersonality = 'Aggressive Growth Chaser';
        else if (conservativeShare > 0.60) investmentPersonality = 'Shielded Risk-Averse';
      }
    }

    // Risk Level
    let riskLevel = 'Moderate';
    if (portfolio) {
      riskLevel = portfolio.riskScore > 65 ? 'Aggressive' : (portfolio.riskScore < 30 ? 'Conservative' : 'Moderate');
    }

    // Stability Score (out of 100)
    let stabilityScore = 50;
    if (context.income > 0) {
      const reserveMonths = context.savings / (context.expenses + 1);
      stabilityScore = Math.min(
        Math.round(
          (savingsRatio * 40) + 
          (Math.max(1 - debtRatio, 0) * 30) + 
          (Math.min(reserveMonths / 6, 1) * 30)
        ) * 100 / 100, 
        100
      );
    }

    // Save/Update Financial Digital Twin in database
    const twinRecord = await FinancialTwin.findOneAndUpdate(
      { userId: req.user },
      {
        income: context.income,
        expenses: context.expenses,
        goalsCount: goals.length,
        assets: {
          stocks: portfolio?.stocks || 0,
          mutualFunds: portfolio?.mutualFunds || 0,
          gold: portfolio?.gold || 0,
          fd: portfolio?.fd || 0,
          crypto: portfolio?.crypto || 0,
          property: portfolio?.property || 0,
          savings: context.savings,
        },
        liabilities: {
          debt: context.debt,
          loans: loan?.existingLoans || 0,
        },
        insurance: {
          healthCoverage: 500000,
          termCoverage: 5000000,
        },
        financialAge,
        riskLevel,
        savingsPersonality,
        investmentPersonality,
        stabilityScore,
        updatedAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    res.json({
      status: 'success',
      data: {
        netWorth,
        portfolioAllocation: portfolio
          ? { stocks: portfolio.stocks, mutualFunds: portfolio.mutualFunds, gold: portfolio.gold, fd: portfolio.fd, crypto: portfolio.crypto, property: portfolio.property }
          : null,
        goalsProgress: goals.map(g => ({ name: g.goalName, target: g.targetAmount, current: g.currentSavings, progress: g.progress })),
        taxSavings: tax ? { oldTax: tax.currentTax, potentialSavings: tax.potentialSavings } : null,
        loanEligibility: loan ? { eligibleAmount: loan.eligibleAmount, safeEmi: loan.safeEmi, maxEmi: loan.maximumEmi } : null,
        purchaseScore: purchase ? { item: purchase.item, score: purchase.purchaseScore, status: purchase.status } : null,
        digitalTwin: {
          financialAge: twinRecord.financialAge,
          riskLevel: twinRecord.riskLevel,
          savingsPersonality: twinRecord.savingsPersonality,
          investmentPersonality: twinRecord.investmentPersonality,
          stabilityScore: twinRecord.stabilityScore,
        },
        plots,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error loading premium dashboard data' });
  }
};

// FEATURE 10: Stock Advisor Recommendations
exports.recommendStocks = async (req, res) => {
  try {
    const { riskProfile, investmentAmount, investmentHorizon } = req.body;

    if (!riskProfile) {
      return res.status(400).json({ status: 'error', message: 'Risk profile is required' });
    }

    const validProfiles = ['Conservative', 'Moderate', 'Aggressive'];
    if (!validProfiles.includes(riskProfile)) {
      return res.status(400).json({ status: 'error', message: 'Invalid risk profile. Must be Conservative, Moderate, or Aggressive.' });
    }

    // Call Python FastAPI Recommender with Gemini API Key
    const response = await fetch(`${AI_SERVICE_URL}/recommend-stocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': process.env.GEMINI_API_KEY || '',
      },
      body: JSON.stringify({
        risk_profile: riskProfile,
        investment_amount: investmentAmount ? parseFloat(investmentAmount) : null,
        investment_horizon: investmentHorizon || null,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Service Error: ${errText}` });
    }

    const result = await response.json();
    res.json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error during stock recommendation' });
  }
};
