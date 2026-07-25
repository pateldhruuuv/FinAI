const fs = require('fs');
const path = require('path');
const NormalizedTransaction = require('../models/NormalizedTransaction');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const RecurringTransaction = require('../models/RecurringTransaction');
const MerchantLearning = require('../models/MerchantLearning');
const UnknownTransaction = require('../models/UnknownTransaction');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// Upload and parse statement statement controller
exports.uploadStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Please upload a CSV, Excel, or PDF bank statement file' });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer]);
    
    const formData = new FormData();
    formData.append('file', fileBlob, req.file.originalname);

    // Call FastAPI Statement Parser
    console.log(`Forwarding statement file ${req.file.originalname} to AI Engine...`);
    const pythonRes = await fetch(`${AI_SERVICE_URL}/parse-statement`, {
      method: 'POST',
      body: formData,
    });

    if (!pythonRes.ok) {
      const errData = await pythonRes.json();
      fs.unlinkSync(filePath); // delete temp file
      return res.status(pythonRes.status).json({
        status: 'error',
        message: errData.detail || 'Failed to parse statement in AI Engine',
      });
    }

    const parseResult = await pythonRes.json();
    fs.unlinkSync(filePath); // Cleanup upload file

    const { transactions, subscriptions, recurring_expenses, detected_bank, detected_format, mapped_columns, metadata, reward_points, validations } = parseResult;

    if (!transactions || transactions.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No valid transactions found in statement' });
    }

    console.log(`Successfully parsed ${transactions.length} transactions. Saving to MongoDB...`);

    // Save normalized transactions
    const savedTransactions = [];
    for (const tx of transactions) {
      // 1. Save to NormalizedTransaction
      const normalizedTx = new NormalizedTransaction({
        userId: req.user,
        date: new Date(tx.date),
        description: tx.description,
        merchant: tx.merchant,
        category: tx.category,
        amount: tx.amount,
        transactionType: tx.transactionType,
        balance: tx.balance,
        confidence: tx.confidence,
        is_unknown: tx.is_unknown,
      });
      const savedTx = await normalizedTx.save();
      savedTransactions.push(savedTx);

      // 2. Save copy to Transaction model for backwards compatibility
      const compatTx = new Transaction({
        userId: req.user,
        date: new Date(tx.date),
        description: tx.description,
        category: tx.category,
        amount: tx.amount,
        type: tx.transactionType, // matches 'Credit' or 'Debit'
      });
      await compatTx.save();

      // 3. If unknown, add to UnknownTransactions list
      if (tx.is_unknown) {
        const unknownTx = new UnknownTransaction({
          userId: req.user,
          transactionId: savedTx._id,
          date: new Date(tx.date),
          description: tx.description,
          amount: tx.amount,
          transactionType: tx.transactionType,
          possibleMerchant: tx.merchant,
          possibleCategory: tx.category,
          confidence: tx.confidence,
          status: 'Needs Review',
        });
        await unknownTx.save();
      }
    }

    // Clear and Save Subscriptions
    await Subscription.deleteMany({ userId: req.user });
    if (subscriptions && subscriptions.length > 0) {
      const subDocs = subscriptions.map((sub) => ({
        userId: req.user,
        name: sub.name,
        frequency: sub.frequency,
        monthlyCost: sub.monthlyCost,
        annualCost: sub.annualCost,
        renewalDate: new Date(sub.renewalDate),
        totalSubscriptionSpending: sub.totalSubscriptionSpending,
      }));
      await Subscription.insertMany(subDocs);
    }

    // Clear and Save Recurring Payments
    await RecurringTransaction.deleteMany({ userId: req.user });
    if (recurring_expenses && recurring_expenses.length > 0) {
      const recDocs = recurring_expenses.map((rec) => ({
        userId: req.user,
        name: rec.name,
        category: rec.category,
        amount: rec.amount,
        frequency: rec.frequency,
        nextDueDate: new Date(rec.nextDueDate),
        type: rec.type,
        lastPaymentDate: new Date(rec.lastPaymentDate),
      }));
      await RecurringTransaction.insertMany(recDocs);
    }

    res.status(201).json({
      status: 'success',
      message: `Parsed statement successfully: detected ${detected_bank} ${detected_format}`,
      count: transactions.length,
      data: {
        detected_bank,
        detected_format,
        mapped_columns,
        transactions: savedTransactions.slice(0, 10), // Return preview of first 10
        total_transactions: transactions.length,
        subscriptions_count: subscriptions ? subscriptions.length : 0,
        recurring_count: recurring_expenses ? recurring_expenses.length : 0,
        metadata: metadata || null,
        reward_points: reward_points || null,
        validations: validations || null
      },
    });
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ status: 'error', message: 'Server error during statement parsing' });
  }
};

// GET /transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await NormalizedTransaction.find({ userId: req.user }).sort({ date: -1 });
    res.json({
      status: 'success',
      count: transactions.length,
      data: transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch normalized transactions' });
  }
};

// GET /subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user });
    res.json({
      status: 'success',
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch subscriptions' });
  }
};

// GET /merchant-analysis
exports.getMerchantAnalysis = async (req, res) => {
  try {
    const transactions = await NormalizedTransaction.find({ userId: req.user });
    
    // Call FastAPI to run expense analysis
    const pythonRes = await fetch(`${AI_SERVICE_URL}/expense-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions }),
    });

    if (!pythonRes.ok) {
      throw new Error('Failed to fetch analysis from AI engine');
    }

    const result = await pythonRes.json();
    res.json({
      status: 'success',
      data: result.data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to generate expense analytics' });
  }
};

// GET /expense-summary
exports.getExpenseSummary = async (req, res) => {
  // Can reuse merchant-analysis or provide basic summary statistics
  try {
    const transactions = await NormalizedTransaction.find({ userId: req.user });
    const pythonRes = await fetch(`${AI_SERVICE_URL}/expense-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions }),
    });

    if (!pythonRes.ok) {
      throw new Error('Failed to fetch summary from AI engine');
    }

    const result = await pythonRes.json();
    res.json({
      status: 'success',
      data: result.data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to generate expense summary' });
  }
};

// POST /update-category
exports.updateCategory = async (req, res) => {
  try {
    const { transactionId, correctedCategory, merchantName } = req.body;

    if (!transactionId || !correctedCategory) {
      return res.status(400).json({ status: 'error', message: 'Transaction ID and corrected category are required' });
    }

    // 1. Update NormalizedTransaction
    const tx = await NormalizedTransaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ status: 'error', message: 'Transaction not found' });
    }

    const oldCategory = tx.category;
    tx.category = correctedCategory;
    tx.confidence = 1.0;
    tx.is_unknown = false;
    if (merchantName) tx.merchant = merchantName;
    await tx.save();

    // 2. Update copy in Transaction model to keep it in sync
    // We match by description, amount, type, date
    await Transaction.findOneAndUpdate(
      {
        userId: req.user,
        description: tx.description,
        amount: tx.amount,
        type: tx.transactionType,
        date: tx.date,
      },
      { category: correctedCategory }
    );

    // 3. Mark as resolved in UnknownTransaction if it exists
    await UnknownTransaction.findOneAndUpdate(
      { transactionId: tx._id },
      { status: 'Resolved' }
    );

    // 4. Save to learning database in MongoDB
    const learning = new MerchantLearning({
      userId: req.user,
      description: tx.description,
      merchantName: merchantName || tx.merchant,
      correctedCategory,
    });
    await learning.save();

    // 5. Sync with Python AI Engine learning database
    console.log(`Syncing category correction for ${tx.merchant} to AI Engine...`);
    await fetch(`${AI_SERVICE_URL}/update-learning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: tx.description,
        merchant: merchantName || tx.merchant,
        category: correctedCategory,
      }),
    });

    res.json({
      status: 'success',
      message: `Category successfully updated from ${oldCategory} to ${correctedCategory}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to update transaction category' });
  }
};
