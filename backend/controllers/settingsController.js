const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// Import models
const User = require('../models/User');
const LinkedAccount = require('../models/LinkedAccount');
const Transaction = require('../models/Transaction');
const NormalizedTransaction = require('../models/NormalizedTransaction');
const RecurringTransaction = require('../models/RecurringTransaction');
const Subscription = require('../models/Subscription');
const DebtAnalysis = require('../models/DebtAnalysis');
const FinancialTwin = require('../models/FinancialTwin');
const Goal = require('../models/Goal');
const Trip = require('../models/Trip');
const Forecast = require('../models/Forecast');
const Recommendation = require('../models/Recommendation');
const Notification = require('../models/Notification');
const ChatHistory = require('../models/ChatHistory');
const Conversation = require('../models/Conversation');
const Loans = require('../models/Loans');
const Portfolio = require('../models/Portfolio');
const PremiumRecommendations = require('../models/PremiumRecommendations');
const PurchaseHistory = require('../models/PurchaseHistory');
const RecommendationHistory = require('../models/RecommendationHistory');
const Reports = require('../models/Reports');
const TaxAnalysis = require('../models/TaxAnalysis');
const UnknownTransaction = require('../models/UnknownTransaction');
const MerchantLearning = require('../models/MerchantLearning');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// Helper: Calculate profile completion percentage
const calculateCompletion = (user) => {
  const fields = [
    'name', 'email', 'phone', 'profileImage', 'dob',
    'gender', 'address', 'city', 'state', 'country', 'occupation'
  ];
  let filledCount = 0;
  fields.forEach(field => {
    if (user[field] && user[field].toString().trim() !== '') {
      filledCount++;
    }
  });
  return Math.round((filledCount / fields.length) * 100);
};

// Helper: Get user's financial details for AI Engine context
const getFinancialDetailsHelper = async (userId, user) => {
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

  const income = totalIncome > 0 ? totalIncome : (user.monthlyIncome || 0);
  const expenses = totalExpenses > 0 ? totalExpenses : (user.monthlyExpenses || 0);
  const savings = totalIncome > 0 ? Math.max(totalIncome - totalExpenses, 0) : (user.savings || Math.max(income - expenses, 0));

  return {
    age: user.age || 30,
    income,
    expenses,
    savings,
    debt,
  };
};

// Helper: Fetch fresh AI recommendations
const recalculateAIRecommendations = async (userId, user) => {
  try {
    const finContext = await getFinancialDetailsHelper(userId, user);

    // 1. Predict Health
    let healthPrediction = 'Moderate';
    try {
      const healthRes = await fetch(`${AI_SERVICE_URL}/predict-health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: finContext.age,
          income: finContext.income,
          expenses: finContext.expenses,
          savings: finContext.savings,
          debt: finContext.debt,
        }),
      });
      if (healthRes.ok) {
        const json = await healthRes.json();
        healthPrediction = json.prediction || 'Moderate';
      }
    } catch (err) {
      console.warn("AI Engine predict-health fail during settings recalculation:", err.message);
    }

    // 2. Recommend Investment
    let shortTerm = 'Fixed Deposit';
    let longTerm = 'Mutual Funds';
    try {
      const investRes = await fetch(`${AI_SERVICE_URL}/recommend-investment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: finContext.age,
          income: finContext.income,
          savings: finContext.savings,
          risk_profile: user.riskProfile || 'Moderate',
        }),
      });
      if (investRes.ok) {
        const json = await investRes.json();
        shortTerm = json.short_term || 'Fixed Deposit';
        longTerm = json.long_term || 'Mutual Funds';
      }
    } catch (err) {
      console.warn("AI Engine recommend-investment fail during settings recalculation:", err.message);
    }

    // 3. Recommend Insurance
    let coverageAmt = 1000000;
    let recInsurance = ['Basic Health Insurance'];
    try {
      const insRes = await fetch(`${AI_SERVICE_URL}/recommend-insurance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: finContext.age,
          income: finContext.income,
          dependents: user.dependents || 0,
          marital_status: user.dependents > 0 ? 'Married' : 'Single',
        }),
      });
      if (insRes.ok) {
        const json = await insRes.json();
        coverageAmt = json.suggested_coverage_amount || 1000000;
        recInsurance = json.recommendations_summary || ['Basic Health Insurance'];
      }
    } catch (err) {
      console.warn("AI Engine recommend-insurance fail during settings recalculation:", err.message);
    }

    let score = 55;
    if (healthPrediction === 'Healthy') score = 85;
    else if (healthPrediction === 'Risky') score = 25;

    // Save recommendations
    await Recommendation.findOneAndUpdate(
      { userId },
      {
        healthStatus: healthPrediction,
        healthScore: score,
        shortTermInvestment: shortTerm,
        longTermInvestment: longTerm,
        recommendedInsurance: recInsurance,
        insuranceCoverageAmount: coverageAmt,
      },
      { new: true, upsert: true }
    );
  } catch (err) {
    console.error("Failed to run AI recommendations recalculation:", err.message);
  }
};

// GET /profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    const profileCompletion = calculateCompletion(user);
    res.json({
      status: 'success',
      user,
      profileCompletion,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error retrieving profile' });
  }
};

// PUT /profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, dob, gender, address, city, state, country, occupation } = req.body;
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (dob) {
      user.dob = new Date(dob);
      // Calculate age
      const diff = Date.now() - user.dob.getTime();
      const ageDate = new Date(diff);
      user.age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    if (gender !== undefined) user.gender = gender;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (country !== undefined) user.country = country;
    if (occupation !== undefined) user.occupation = occupation;

    await user.save();
    
    // Automatically recalculate recommendations in background if age/dob changed
    if (dob) {
      recalculateAIRecommendations(req.user, user);
    }

    const updatedUser = await User.findById(req.user).select('-password');
    const profileCompletion = calculateCompletion(updatedUser);

    res.json({
      status: 'success',
      user: updatedUser,
      profileCompletion,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error updating profile' });
  }
};

// PUT /financial-profile
exports.updateFinancialProfile = async (req, res) => {
  try {
    const {
      monthlyIncome,
      monthlyExpenses,
      savings,
      emergencyFund,
      riskProfile,
      investmentExperience,
      investmentGoal,
      retirementAge,
      dependents,
      occupation
    } = req.body;

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (monthlyIncome !== undefined) user.monthlyIncome = parseFloat(monthlyIncome);
    if (monthlyExpenses !== undefined) user.monthlyExpenses = parseFloat(monthlyExpenses);
    if (savings !== undefined) user.savings = parseFloat(savings);
    if (emergencyFund !== undefined) user.emergencyFund = parseFloat(emergencyFund);
    if (riskProfile !== undefined) user.riskProfile = riskProfile;
    if (investmentExperience !== undefined) user.investmentExperience = investmentExperience;
    if (investmentGoal !== undefined) user.investmentGoal = investmentGoal;
    if (retirementAge !== undefined) user.retirementAge = parseInt(retirementAge);
    if (dependents !== undefined) user.dependents = parseInt(dependents);
    if (occupation !== undefined) user.occupation = occupation;

    await user.save();

    // Call FastAPI engine in background to trigger recommendations update
    await recalculateAIRecommendations(req.user, user);

    const updatedUser = await User.findById(req.user).select('-password');
    const profileCompletion = calculateCompletion(updatedUser);

    res.json({
      status: 'success',
      user: updatedUser,
      profileCompletion,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error updating financial profile' });
  }
};

// PUT /preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { theme, language, currency, dashboardLayout, defaultLandingPage } = req.body;
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (theme) user.theme = theme;
    if (language) user.language = language;
    if (currency) user.currency = currency;
    if (dashboardLayout) user.dashboardLayout = dashboardLayout;
    if (defaultLandingPage) user.defaultLandingPage = defaultLandingPage;

    await user.save();

    const updatedUser = await User.findById(req.user).select('-password');
    res.json({
      status: 'success',
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error updating preferences' });
  }
};

// PUT /notifications
exports.updateNotifications = async (req, res) => {
  try {
    const {
      email,
      sms,
      investmentAlerts,
      billReminders,
      subscriptionRenewal,
      goalAchievement,
      marketNews,
      aiRecommendation
    } = req.body;

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (email !== undefined) user.notifications.email = email;
    if (sms !== undefined) user.notifications.sms = sms;
    if (investmentAlerts !== undefined) user.notifications.investmentAlerts = investmentAlerts;
    if (billReminders !== undefined) user.notifications.billReminders = billReminders;
    if (subscriptionRenewal !== undefined) user.notifications.subscriptionRenewal = subscriptionRenewal;
    if (goalAchievement !== undefined) user.notifications.goalAchievement = goalAchievement;
    if (marketNews !== undefined) user.notifications.marketNews = marketNews;
    if (aiRecommendation !== undefined) user.notifications.aiRecommendation = aiRecommendation;

    await user.save();

    const updatedUser = await User.findById(req.user).select('-password');
    res.json({
      status: 'success',
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error updating notifications' });
  }
};

// PUT /security/change-password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ status: 'error', message: 'New password is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Verify old password only for traditional password-login users
    if (user.provider !== 'google') {
      if (!oldPassword) {
        return res.status(400).json({ status: 'error', message: 'Current password is required' });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ status: 'error', message: 'Current password incorrect' });
      }
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ status: 'success', message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error changing password' });
  }
};

// POST /upload-profile-image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Please upload an image file' });
    }

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Save relative URL path
    const filePath = `/uploads/profile_pics/${req.file.filename}`;
    user.profileImage = filePath;
    await user.save();

    const updatedUser = await User.findById(req.user).select('-password');
    const profileCompletion = calculateCompletion(updatedUser);

    res.json({
      status: 'success',
      user: updatedUser,
      profileCompletion,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error uploading profile picture' });
  }
};

// GET /linked-accounts
exports.getLinkedAccounts = async (req, res) => {
  try {
    const accounts = await LinkedAccount.find({ userId: req.user });
    res.json({ status: 'success', accounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error retrieving linked accounts' });
  }
};

// POST /linked-accounts
exports.addLinkedAccount = async (req, res) => {
  try {
    const { accountType, institutionName, accountNumber, balance, currency } = req.body;
    if (!accountType || !institutionName || !accountNumber || balance === undefined) {
      return res.status(400).json({ status: 'error', message: 'Please provide accountType, institutionName, accountNumber, and balance' });
    }

    // Mask account number (leave only last 4 digits visible)
    const rawNum = accountNumber.toString().trim();
    const maskedNumber = rawNum.length > 4 ? '*'.repeat(rawNum.length - 4) + rawNum.slice(-4) : rawNum;

    const account = new LinkedAccount({
      userId: req.user,
      accountType,
      institutionName,
      accountNumber: maskedNumber,
      balance: parseFloat(balance),
      currency: currency || 'INR',
    });

    await account.save();
    res.status(201).json({ status: 'success', account });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error linking account' });
  }
};

// DELETE /linked-accounts/:id
exports.removeLinkedAccount = async (req, res) => {
  try {
    const account = await LinkedAccount.findOneAndDelete({ _id: req.params.id, userId: req.user });
    if (!account) {
      return res.status(404).json({ status: 'error', message: 'Linked account not found or unauthorized' });
    }
    res.json({ status: 'success', message: 'Account unlinked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error unlinking account' });
  }
};

// POST /linked-accounts/refresh
exports.refreshLinkedAccounts = async (req, res) => {
  try {
    await LinkedAccount.updateMany({ userId: req.user }, { lastRefreshed: new Date() });
    const accounts = await LinkedAccount.find({ userId: req.user });
    res.json({ status: 'success', accounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error refreshing accounts' });
  }
};

// DELETE /account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user;

    // Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Cascade deletions
    await ChatHistory.deleteMany({ userId });
    await Conversation.deleteMany({ userId });
    await DebtAnalysis.deleteMany({ userId });
    await FinancialTwin.deleteMany({ userId });
    await Forecast.deleteMany({ userId });
    await Goal.deleteMany({ userId });
    await Loans.deleteMany({ userId });
    await MerchantLearning.deleteMany({ userId });
    await NormalizedTransaction.deleteMany({ userId });
    await Notification.deleteMany({ userId });
    await Portfolio.deleteMany({ userId });
    await PremiumRecommendations.deleteMany({ userId });
    await PurchaseHistory.deleteMany({ userId });
    await Recommendation.deleteMany({ userId });
    await RecommendationHistory.deleteMany({ userId });
    await RecurringTransaction.deleteMany({ userId });
    await Reports.deleteMany({ userId });
    await Subscription.deleteMany({ userId });
    await TaxAnalysis.deleteMany({ userId });
    await Transaction.deleteMany({ userId });
    await Trip.deleteMany({ userId });
    await UnknownTransaction.deleteMany({ userId });
    await LinkedAccount.deleteMany({ userId });

    // Finally delete user
    await User.findByIdAndDelete(userId);

    res.json({ status: 'success', message: 'Account and all related records have been permanently deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during account deletion' });
  }
};

// POST /privacy/download-data
exports.downloadPersonalData = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const linkedAccounts = await LinkedAccount.find({ userId }).lean();
    const portfolio = await Portfolio.findOne({ userId }).lean();
    const goals = await Goal.find({ userId }).lean();
    const recommendations = await Recommendation.findOne({ userId }).lean();
    const transactions = await Transaction.find({ userId }).limit(100).lean(); // Limit to last 100 for export size

    const personalData = {
      exportMetadata: {
        exportedAt: new Date(),
        version: '1.0.0',
        app: 'Finmate AI'
      },
      profile: user,
      linkedAccounts,
      portfolio: portfolio || {},
      goals,
      recommendations: recommendations || {},
      recentTransactions: transactions
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=Finmate_PersonalData_${userId}.json`);
    res.send(JSON.stringify(personalData, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error exporting personal data' });
  }
};

// POST /privacy/delete-statements
exports.deleteUploadedStatements = async (req, res) => {
  try {
    const userId = req.user;
    await Transaction.deleteMany({ userId });
    await NormalizedTransaction.deleteMany({ userId });
    await RecurringTransaction.deleteMany({ userId });
    await Subscription.deleteMany({ userId });
    await UnknownTransaction.deleteMany({ userId });
    await DebtAnalysis.deleteMany({ userId });

    res.json({ status: 'success', message: 'All uploaded statements and transactions have been deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error deleting statement uploads' });
  }
};

// PUT /privacy/sharing-consent
exports.updateSharingConsent = async (req, res) => {
  try {
    const { consent } = req.body;
    if (consent === undefined) {
      return res.status(400).json({ status: 'error', message: 'Consent boolean is required' });
    }
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    user.dataSharingConsent = !!consent;
    await user.save();
    res.json({ status: 'success', dataSharingConsent: user.dataSharingConsent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error updating data sharing preferences' });
  }
};

// POST /settings/reports
exports.downloadSettingsReport = async (req, res) => {
  try {
    const { reportType, format, scope } = req.body;
    if (!reportType || !format) {
      return res.status(400).json({ status: 'error', message: 'Report type and file format are required' });
    }

    const userId = req.user;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const isCSV = format.toUpperCase() === 'CSV';

    // Compute Date Threshold from Scope
    let dateLimit = null;
    let scopeLabel = 'Yearly (Last 365 Days)';
    if (scope === 'Monthly') {
      dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - 30);
      scopeLabel = 'Monthly (Last 30 Days)';
    } else if (scope === 'Quarterly') {
      dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - 90);
      scopeLabel = 'Quarterly (Last 90 Days)';
    } else {
      dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - 365);
    }

    if (reportType === 'Expense') {
      const query = { userId };
      if (dateLimit) {
        query.date = { $gte: dateLimit };
      }
      const transactions = await Transaction.find(query);
      const categories = {};
      let totalSpent = 0;
      let totalIncome = 0;

      transactions.forEach(t => {
        if (t.type === 'Debit') {
          categories[t.category] = (categories[t.category] || 0) + t.amount;
          totalSpent += t.amount;
        } else {
          totalIncome += t.amount;
        }
      });

      if (isCSV) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=Finmate_Expense_Report.csv`);
        let csv = `Report Scope,${scopeLabel}\nCategory,Spent Amount\n`;
        Object.entries(categories).forEach(([cat, amt]) => {
          csv += `"${cat}",₹${amt}\n`;
        });
        csv += `\nTotal Expense,,₹${totalSpent}\n`;
        csv += `Total Income,,₹${totalIncome}\n`;
        csv += `Net Savings Ratio,,${totalIncome > 0 ? ((totalIncome - totalSpent)/totalIncome * 100).toFixed(1) : 0}%\n`;
        return res.send(csv);
      } else {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Finmate_Expense_Report.pdf`);
        doc.pipe(res);

        doc.rect(0, 0, 612, 100).fill('#1e1b4b');
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('Finmate AI', 50, 30);
        doc.fontSize(12).font('Helvetica').text(`Expense & Ledger Report - ${scopeLabel}`, 50, 60);

        doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(`Client Expense Overview`, 50, 130);
        doc.fontSize(10).font('Helvetica')
           .text(`Prepared For: ${user.name}`, 50, 155)
           .text(`Email: ${user.email}`, 50, 170)
           .text(`Scope Period: ${scopeLabel}`, 50, 185);

        doc.moveTo(50, 210).lineTo(560, 210).strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.fontSize(12).font('Helvetica-Bold').text('Category Breakdown', 50, 230);
        let offset = 260;
        Object.entries(categories).forEach(([cat, amt]) => {
          doc.fontSize(10).font('Helvetica').text(cat, 50, offset);
          doc.text(`₹${amt.toLocaleString()}`, 250, offset);
          offset += 20;
        });

        doc.moveTo(50, offset).lineTo(560, offset).strokeColor('#e5e7eb').stroke();
        offset += 15;
        doc.fontSize(11).font('Helvetica-Bold').text(`Total Expenses: ₹${totalSpent.toLocaleString()}`, 50, offset);
        doc.text(`Total Income Reference: ₹${totalIncome.toLocaleString()}`, 250, offset);

        doc.end();
      }
    } 
    else if (reportType === 'Investment') {
      const portfolio = await Portfolio.findOne({ userId }) || {
        stocks: 0, mutualFunds: 0, gold: 0, fd: 0, crypto: 0, property: 0
      };
      const recommendation = await Recommendation.findOne({ userId }) || {
        shortTermInvestment: 'Fixed Deposit', longTermInvestment: 'Mutual Funds'
      };

      const totalVal = (portfolio.stocks + portfolio.mutualFunds + portfolio.gold + portfolio.fd + portfolio.crypto + portfolio.property);

      if (isCSV) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=Finmate_Investment_Report.csv`);
        let csv = 'Asset Class,Current Value\n';
        csv += `Stocks,₹${portfolio.stocks}\n`;
        csv += `Mutual Funds,₹${portfolio.mutualFunds}\n`;
        csv += `Gold,₹${portfolio.gold}\n`;
        csv += `Fixed Deposits,₹${portfolio.fd}\n`;
        csv += `Crypto,₹${portfolio.crypto}\n`;
        csv += `Property,₹${portfolio.property}\n`;
        csv += `\nTotal Net Valuation,,₹${totalVal}\n`;
        csv += `AI Recommended Short-Term Target,,${recommendation.shortTermInvestment}\n`;
        csv += `AI Recommended Long-Term Target,,${recommendation.longTermInvestment}\n`;
        return res.send(csv);
      } else {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Finmate_Investment_Report.pdf`);
        doc.pipe(res);

        doc.rect(0, 0, 612, 100).fill('#1e1b4b');
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('Finmate AI', 50, 30);
        doc.fontSize(12).font('Helvetica').text('Portfolio Allocation & Investment Advisory', 50, 60);

        doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(`Investment Portfolio Overview`, 50, 130);
        doc.fontSize(10).font('Helvetica')
           .text(`Prepared For: ${user.name}`, 50, 155)
           .text(`Total Portfolio Net Value: ₹${totalVal.toLocaleString()}`, 50, 170)
           .text(`Risk Profile: ${user.riskProfile || 'Moderate'}`, 50, 185);

        doc.moveTo(50, 210).lineTo(560, 210).strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.fontSize(12).font('Helvetica-Bold').text('Asset Allocation Matrix', 50, 230);
        let offset = 265;
        const assets = [
          { name: 'Direct Equity (Stocks)', val: portfolio.stocks },
          { name: 'Mutual Funds', val: portfolio.mutualFunds },
          { name: 'Gold / Precious Metals', val: portfolio.gold },
          { name: 'Fixed Deposits (FD)', val: portfolio.fd },
          { name: 'Cryptocurrency', val: portfolio.crypto },
          { name: 'Real Estate / Property', val: portfolio.property },
        ];

        assets.forEach(a => {
          doc.fontSize(10).font('Helvetica').text(a.name, 50, offset);
          doc.text(`₹${(a.val || 0).toLocaleString()}`, 250, offset);
          doc.text(`${totalVal > 0 ? (((a.val || 0) / totalVal) * 100).toFixed(1) : 0}%`, 380, offset);
          offset += 20;
        });

        doc.moveTo(50, offset).lineTo(560, offset).strokeColor('#e5e7eb').stroke();
        offset += 20;

        doc.fontSize(12).font('Helvetica-Bold').text('AI Advisor Portfolio Suggestions', 50, offset);
        offset += 20;
        doc.fontSize(10).font('Helvetica-Bold').text('Short-Term Allocation Focus:', 50, offset);
        doc.font('Helvetica').text(recommendation.shortTermInvestment || 'Fixed Deposits', 250, offset);
        offset += 20;
        doc.fontSize(10).font('Helvetica-Bold').text('Long-Term Allocation Focus:', 50, offset);
        doc.font('Helvetica').text(recommendation.longTermInvestment || 'Equity Index Funds', 250, offset);

        doc.end();
      }
    } 
    else if (reportType === 'Insurance') {
      const recommendation = await Recommendation.findOne({ userId }) || {
        recommendedInsurance: ['Basic Health Insurance'],
        insuranceCoverageAmount: 1000000
      };

      if (isCSV) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=Finmate_Insurance_Report.csv`);
        let csv = 'Advisory Parameter,Value\n';
        csv += `Suggested Net Protection Coverage,₹${recommendation.insuranceCoverageAmount}\n`;
        csv += `Total Dependents,${user.dependents || 0}\n`;
        csv += `Recommended Policy List,"${recommendation.recommendedInsurance ? recommendation.recommendedInsurance.join('; ') : ''}"\n`;
        return res.send(csv);
      } else {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Finmate_Insurance_Report.pdf`);
        doc.pipe(res);

        doc.rect(0, 0, 612, 100).fill('#1e1b4b');
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('Finmate AI', 50, 30);
        doc.fontSize(12).font('Helvetica').text('Risk Mitigation & Insurance Gap Analysis', 50, 60);

        doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(`Client Risk Summary`, 50, 130);
        doc.fontSize(10).font('Helvetica')
           .text(`Prepared For: ${user.name}`, 50, 155)
           .text(`Dependents: ${user.dependents || 0} family members`, 50, 170)
           .text(`Report Compilation: ${new Date().toLocaleDateString()}`, 50, 185);

        doc.moveTo(50, 210).lineTo(560, 210).strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.fontSize(12).font('Helvetica-Bold').text('AI Recommended Policies & Coverage', 50, 230);
        doc.fontSize(11).font('Helvetica')
           .text(`Suggested Term/Health Coverage Amount: ₹${(recommendation.insuranceCoverageAmount || 1000000).toLocaleString()}`, 50, 255);

        let offset = 295;
        doc.fontSize(12).font('Helvetica-Bold').text('Recommended Coverage Breakdown:', 50, 280);
        if (recommendation.recommendedInsurance && recommendation.recommendedInsurance.length > 0) {
          recommendation.recommendedInsurance.forEach((policy, idx) => {
            doc.fontSize(10).font('Helvetica').text(`• ${policy}`, 50, offset);
            offset += 20;
          });
        } else {
          doc.fontSize(10).font('Helvetica').text('• Basic Family Health Cover (Min ₹10LSum Insured)', 50, offset);
          offset += 20;
          doc.text('• Term Life Policy (suggested 10x annual income)', 50, offset);
        }

        doc.end();
      }
    } 
    else if (reportType === 'Tax') {
      const tax = await TaxAnalysis.findOne({ userId }).sort({ createdAt: -1 });

      let incomeMultiplier = 12;
      if (scope === 'Monthly') incomeMultiplier = 1;
      else if (scope === 'Quarterly') incomeMultiplier = 3;

      const annualIncome = user.monthlyIncome * incomeMultiplier;

      // Dummy calculation helper scaled to scope
      const taxableOld = Math.max(annualIncome - (150000 / 12 * incomeMultiplier) - (50000 / 12 * incomeMultiplier), 0);
      const taxableNew = Math.max(annualIncome - (75000 / 12 * incomeMultiplier), 0);
      
      const estimatedOldRegime = taxableOld <= (500000 / 12 * incomeMultiplier) ? 0 : taxableOld * 0.15;
      const estimatedNewRegime = taxableNew <= (700000 / 12 * incomeMultiplier) ? 0 : taxableNew * 0.10;

      const oldTax = tax ? (tax.oldRegimeTax / 12 * incomeMultiplier) : estimatedOldRegime;
      const newTax = tax ? (tax.newRegimeTax / 12 * incomeMultiplier) : estimatedNewRegime;
      const savings = Math.max(oldTax - newTax, 0);

      if (isCSV) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=Finmate_Tax_Report.csv`);
        let csv = `Report Scope,${scopeLabel}\nTax Category,Amount\n`;
        csv += `Estimated Annual Gross Income,₹${annualIncome}\n`;
        csv += `Old Regime Estimated Tax Liability,₹${oldTax}\n`;
        csv += `New Regime Estimated Tax Liability,₹${newTax}\n`;
        csv += `Optimal Tax Regime Preference,${oldTax < newTax ? 'Old Regime' : 'New Regime'}\n`;
        csv += `Potential optimization savings,₹${savings}\n`;
        return res.send(csv);
      } else {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Finmate_Tax_Report.pdf`);
        doc.pipe(res);

        doc.rect(0, 0, 612, 100).fill('#1e1b4b');
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('Finmate AI', 50, 30);
        doc.fontSize(12).font('Helvetica').text(`Tax Optimization & Regime Evaluation - ${scopeLabel}`, 50, 60);

        doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(`Client Tax Optimization Audit`, 50, 130);
        doc.fontSize(10).font('Helvetica')
           .text(`Prepared For: ${user.name}`, 50, 155)
           .text(`Gross Income Base (${scope || 'Yearly'}): ₹${annualIncome.toLocaleString()}`, 50, 170)
           .text(`Scope Period: ${scopeLabel}`, 50, 185);

        doc.moveTo(50, 210).lineTo(560, 210).strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.fontSize(12).font('Helvetica-Bold').text('Comparative Analysis (FY 2024-25)', 50, 230);
        doc.fontSize(10).font('Helvetica')
           .text(`Old Income Tax Regime Liability: ₹${oldTax.toLocaleString()}`, 50, 255)
           .text(`New Income Tax Regime Liability: ₹${newTax.toLocaleString()}`, 50, 275)
           .text(`Optimal Suggested Regime: ${oldTax < newTax ? 'Old Regime (with deductions)' : 'New Regime (default standard)'}`, 50, 295);

        doc.rect(50, 325, 512, 45).fill('#e0f2fe');
        doc.fillColor('#0369a1').fontSize(11).font('Helvetica-Bold').text(`POTENTIAL REGIME SWITCH SAVINGS: ₹${savings.toLocaleString()}`, 65, 342);

        doc.end();
      }
    } 
    else {
      // Default: Financial Health Report
      const rec = await Recommendation.findOne({ userId }) || {
        healthScore: 50,
        healthStatus: 'Moderate'
      };

      const query = { userId };
      if (dateLimit) {
        query.date = { $gte: dateLimit };
      }
      const transactions = await Transaction.find(query);
      
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

      const income = totalIncome > 0 ? totalIncome : (user.monthlyIncome * (scope === 'Monthly' ? 1 : (scope === 'Quarterly' ? 3 : 12)));
      const expenses = totalExpenses > 0 ? totalExpenses : (user.monthlyExpenses * (scope === 'Monthly' ? 1 : (scope === 'Quarterly' ? 3 : 12)));
      const savings = totalIncome > 0 ? Math.max(totalIncome - totalExpenses, 0) : Math.max(income - expenses, 0);
      
      const finDetails = { income, expenses, savings, debt };

      if (isCSV) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=Finmate_Health_Report.csv`);
        let csv = `Report Scope,${scopeLabel}\nParameter,Value\n`;
        csv += `Financial Health Index Rating,${rec.healthScore} / 100\n`;
        csv += `System Diagnostic Classification,${rec.healthStatus}\n`;
        csv += `Calculated Income Base,₹${finDetails.income}\n`;
        csv += `Calculated Expense Load,₹${finDetails.expenses}\n`;
        csv += `Estimated Net Savings,₹${finDetails.savings}\n`;
        csv += `Calculated Debt Liability,₹${finDetails.debt}\n`;
        return res.send(csv);
      } else {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Finmate_Health_Report.pdf`);
        doc.pipe(res);

        doc.rect(0, 0, 612, 100).fill('#1e1b4b');
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('Finmate AI', 50, 30);
        doc.fontSize(12).font('Helvetica').text(`Comprehensive Financial Diagnostics Audit - ${scopeLabel}`, 50, 60);

        doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(`Client Diagnostics Dossier`, 50, 130);
        doc.fontSize(10).font('Helvetica')
           .text(`Prepared For: ${user.name}`, 50, 155)
           .text(`Financial Age: ${user.age || 'N/A'} years`, 50, 170)
           .text(`Scope Period: ${scopeLabel}`, 50, 185);

        doc.moveTo(50, 210).lineTo(560, 210).strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.fontSize(12).font('Helvetica-Bold').text('Diagnostics Metrics', 50, 230);
        doc.fontSize(10).font('Helvetica')
           .text(`Current Income Level: ₹${finDetails.income.toLocaleString()}`, 50, 255)
           .text(`Calculated Outflow load: ₹${finDetails.expenses.toLocaleString()}`, 50, 275)
           .text(`Emergency Fund Quotient: ${finDetails.expenses > 0 ? (finDetails.savings / finDetails.expenses).toFixed(1) : 0} months cover`, 50, 295);

        const statusColor = rec.healthStatus === 'Healthy' ? '#10b981' : (rec.healthStatus === 'Moderate' ? '#f59e0b' : '#ef4444');
        doc.rect(50, 325, 512, 50).fill(statusColor);
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold')
           .text(`DIAGNOSTIC STATUS: ${rec.healthStatus.toUpperCase()} (${rec.healthScore} / 100)`, 65, 343);

        doc.end();
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error downloading settings report' });
  }
};
