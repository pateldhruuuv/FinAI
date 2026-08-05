const fs = require('fs');
const csv = require('csv-parser');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const NormalizedTransaction = require('../models/NormalizedTransaction');
const UnknownTransaction = require('../models/UnknownTransaction');

// Upload Bank Statement CSV
exports.uploadStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Please upload a CSV file' });
    }

    const filePath = req.file.path;
    const transactions = [];

    // Parse CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Expected headers: Date, Description, Category, Amount, Type
        // Clean columns (handle whitespace/case differences)
        const keys = Object.keys(row);
        const findKey = (name) => keys.find(k => k.trim().toLowerCase() === name.toLowerCase());

        const dateKey = findKey('date');
        const descKey = findKey('description');
        const catKey = findKey('category');
        const amtKey = findKey('amount');
        const typeKey = findKey('type');

        if (dateKey && amtKey && typeKey) {
          // Parse amount
          const amtStr = row[amtKey].replace(/[^0-9.-]+/g, '');
          const amount = parseFloat(amtStr);

          // Type must be Credit or Debit
          let type = row[typeKey].trim();
          type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(); // Normalize to Credit/Debit
          if (type !== 'Credit' && type !== 'Debit') {
            type = amount >= 0 ? 'Credit' : 'Debit';
          }

          transactions.push({
            userId: req.user,
            date: new Date(row[dateKey]),
            description: row[descKey] ? row[descKey].trim() : 'No description',
            category: row[catKey] ? row[catKey].trim() : 'Other',
            amount: Math.abs(amount),
            type,
          });
        }
      })
      .on('end', async () => {
        try {
          if (transactions.length === 0) {
            fs.unlinkSync(filePath); // Delete temporary file
            return res.status(400).json({ status: 'error', message: 'No valid transactions found in CSV' });
          }

          // Save to database
          await Transaction.insertMany(transactions);

          // Delete temporary file
          fs.unlinkSync(filePath);

          res.status(201).json({
            status: 'success',
            message: `Successfully uploaded ${transactions.length} transactions`,
            count: transactions.length,
          });
        } catch (dbErr) {
          console.error(dbErr);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          res.status(500).json({ status: 'error', message: 'Database insert failed' });
        }
      })
      .on('error', (csvErr) => {
        console.error(csvErr);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ status: 'error', message: 'Failed to parse CSV file' });
      });
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ status: 'error', message: 'Server error during file upload' });
  }
};

// Get Dashboard Data and Financial Health Score
exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Fetch transactions
    const transactions = await Transaction.find({ userId: req.user }).sort({ date: -1 });

    let totalIncome = 0;
    let totalExpenses = 0;
    let debt = 0;
    const categoryTotals = {};

    transactions.forEach((tx) => {
      if (tx.type === 'Credit') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        // Build category breakdown for expenses
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;

        // Identify Debt/EMI category
        const catLower = tx.category.toLowerCase();
        if (catLower.includes('emi') || catLower.includes('debt') || catLower.includes('loan') || catLower.includes('credit card')) {
          debt += tx.amount;
        }
      }
    });

    // Recent 10 transactions
    const recentTransactions = transactions.slice(0, 10);

    // Calculate metrics
    // Use user profile monthlyIncome as primary if no income transaction uploaded, or fallback
    const incomeBase = totalIncome > 0 ? totalIncome : user.monthlyIncome;
    const savings = totalIncome > 0 ? Math.max(totalIncome - totalExpenses, 0) : Math.max(user.monthlyIncome - totalExpenses, 0);

    // Ratios
    const savingsRatio = incomeBase > 0 ? savings / incomeBase : 0;
    const debtRatio = incomeBase > 0 ? debt / incomeBase : 0;
    const emergencyFund = totalExpenses > 0 ? savings / totalExpenses : 0; // accumulated savings vs expenses ratio

    // Generate score
    let savingsScore = 0;
    if (savingsRatio >= 0.3) savingsScore = 40;
    else if (savingsRatio >= 0.1) savingsScore = 20;
    else savingsScore = 5;

    let debtScore = 0;
    if (debtRatio <= 0.1) debtScore = 30;
    else if (debtRatio <= 0.3) debtScore = 20;
    else if (debtRatio <= 0.5) debtScore = 10;
    else debtScore = 0;

    let emergencyScore = 0;
    if (emergencyFund >= 3) emergencyScore = 30;
    else if (emergencyFund >= 1.5) emergencyScore = 20;
    else if (emergencyFund >= 0.5) emergencyScore = 10;
    else emergencyScore = 0;

    const healthScore = savingsScore + debtScore + emergencyScore;

    let healthStatus = 'Average';
    if (healthScore >= 81) healthStatus = 'Excellent';
    else if (healthScore >= 61) healthStatus = 'Good';
    else if (healthScore >= 31) healthStatus = 'Average';
    else healthStatus = 'Critical';

    res.json({
      status: 'success',
      data: {
        totalIncome,
        totalExpenses,
        totalSavings: savings,
        monthlyIncomeBase: incomeBase,
        debt,
        ratios: {
          savingsRatio,
          debtRatio,
          emergencyFund,
        },
        healthScore,
        healthStatus,
        expenseCategories: Object.keys(categoryTotals).map((cat) => ({
          category: cat,
          amount: categoryTotals[cat],
        })),
        recentTransactions,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error while fetching dashboard data' });
  }
};

// DELETE /transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const txId = req.params.id;
    
    // Find transaction in Transaction collection
    const tx = await Transaction.findOne({ _id: txId, userId: req.user });
    if (!tx) {
      // If not in Transaction, check if it's a NormalizedTransaction ID directly
      const normTx = await NormalizedTransaction.findOne({ _id: txId, userId: req.user });
      if (!normTx) {
        return res.status(404).json({ status: 'error', message: 'Transaction not found' });
      }
      
      // Delete from NormalizedTransaction
      await NormalizedTransaction.deleteOne({ _id: normTx._id });
      
      // Find and delete matching Transaction (matching by date, amount, description)
      await Transaction.deleteOne({
        userId: req.user,
        date: normTx.date,
        amount: normTx.amount,
        description: normTx.description
      });
      
      // Also delete from UnknownTransaction if present
      await UnknownTransaction.deleteOne({ transactionId: normTx._id });
      
      return res.status(200).json({ status: 'success', message: 'Transaction deleted successfully' });
    }

    // It was found in Transaction collection. Delete it
    await Transaction.deleteOne({ _id: tx._id });

    // Find and delete matching NormalizedTransaction
    const normMatch = await NormalizedTransaction.findOne({
      userId: req.user,
      date: tx.date,
      amount: tx.amount,
      description: tx.description
    });

    if (normMatch) {
      await NormalizedTransaction.deleteOne({ _id: normMatch._id });
      await UnknownTransaction.deleteOne({ transactionId: normMatch._id });
    }

    res.status(200).json({
      status: 'success',
      message: 'Transaction deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error deleting transaction' });
  }
};
