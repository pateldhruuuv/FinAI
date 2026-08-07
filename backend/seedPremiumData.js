const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load models
const User = require('./models/User');
const Portfolio = require('./models/Portfolio');
const Loans = require('./models/Loans');
const TaxAnalysis = require('./models/TaxAnalysis');
const Recommendation = require('./models/Recommendation');

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finpilot';

const DIVERSIFICATIONS = ['Low', 'Medium', 'High'];
const RISKS = ['Low', 'Medium', 'High'];

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB at ${MONGO_URI}`);

    console.log('Cleaning old premium seed data...');
    // Clean old premium user seed records
    const seedEmails = [];
    for (let i = 1; i <= 500; i++) {
      seedEmails.push(`premium_user_${i}@finpilot.com`);
    }

    const oldUsers = await User.find({ email: { $in: seedEmails } });
    const oldUserIds = oldUsers.map(u => u._id);

    console.log(`Deleting existing records for ${oldUserIds.length} old seed users...`);
    await User.deleteMany({ email: { $in: seedEmails } });
    await Portfolio.deleteMany({ userId: { $in: oldUserIds } });
    await Loans.deleteMany({ userId: { $in: oldUserIds } });
    await TaxAnalysis.deleteMany({ userId: { $in: oldUserIds } });
    await Recommendation.deleteMany({ userId: { $in: oldUserIds } });

    console.log('Generating password hash...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    console.log('Seeding 500 Premium Users...');
    const usersToInsert = [];
    for (let i = 1; i <= 500; i++) {
      usersToInsert.push({
        name: `Premium User ${i}`,
        email: `premium_user_${i}@finpilot.com`,
        password: passwordHash,
        age: Math.floor(Math.random() * 45) + 20, // 20 to 64
        monthlyIncome: Math.floor(Math.random() * 200000) + 40000, // 40k to 240k
        isPremium: true,
      });
    }
    const insertedUsers = await User.insertMany(usersToInsert);
    const userIds = insertedUsers.map(u => u._id);
    console.log(`Successfully seeded 500 Premium Users`);

    // 500 Portfolio records
    console.log('Seeding 500 Portfolio Records...');
    const portfolios = [];
    for (let i = 0; i < 500; i++) {
      const uId = userIds[i];
      portfolios.push({
        userId: uId,
        stocks: Math.floor(Math.random() * 200000) + 10000,
        mutualFunds: Math.floor(Math.random() * 300000) + 20000,
        gold: Math.floor(Math.random() * 50000) + 5000,
        fd: Math.floor(Math.random() * 150000) + 10000,
        crypto: Math.floor(Math.random() * 30000) + 2000,
        property: Math.floor(Math.random() * 1000000) + 100000,
        riskScore: Math.floor(Math.random() * 60) + 20, // 20 to 80
        diversification: DIVERSIFICATIONS[i % DIVERSIFICATIONS.length],
        safeAllocation: {
          cashFd: 50000,
          bondsDebt: 80000,
          equity: 120000,
          gold: 20000,
        },
        recommendations: [
          'Rebalance portfolio to reduce direct stock concentration risk.',
          'Consider allocating 10% in physical Gold or gold ETFs.',
        ],
        highRiskAssets: ['Crypto: exposure exceeds recommended limit of 5%'],
        portfolioChart: '', // generated dynamically in API
      });
    }
    await Portfolio.insertMany(portfolios);
    console.log('Successfully seeded 500 Portfolio Records');

    // 500 Loan records
    console.log('Seeding 500 Loan Records...');
    const loans = [];
    for (let i = 0; i < 500; i++) {
      const uId = userIds[i];
      const income = insertedUsers[i].monthlyIncome;
      loans.push({
        userId: uId,
        income,
        age: insertedUsers[i].age,
        creditScore: Math.floor(Math.random() * 250) + 600, // 600 to 850
        currentEmi: Math.floor(Math.random() * 20000) + 2000,
        existingLoans: Math.floor(Math.random() * 800000) + 10000,
        eligibleAmount: Math.floor(Math.random() * 4000000) + 500000,
        maximumEmi: Math.round(income * 0.5),
        safeEmi: Math.round(income * 0.35),
        loanRisk: RISKS[i % RISKS.length],
        breakdown: {
          personalLoan: Math.floor(Math.random() * 300000) + 50000,
          educationLoan: Math.floor(Math.random() * 500000) + 100000,
          carLoan: Math.floor(Math.random() * 600000) + 80000,
          homeLoan: Math.floor(Math.random() * 3500000) + 400000,
        },
      });
    }
    await Loans.insertMany(loans);
    console.log('Successfully seeded 500 Loan Records');

    // Sample Tax & Insurance Data
    console.log('Seeding Sample Tax & Insurance Data...');
    const taxRecords = [];
    const insuranceRecords = [];

    for (let i = 0; i < 500; i++) {
      const uId = userIds[i];
      const income = insertedUsers[i].monthlyIncome * 12;

      // Tax records
      taxRecords.push({
        userId: uId,
        annualIncome: income,
        salaryStructure: {
          basic: Math.round(income * 0.45),
          hra: Math.round(income * 0.15),
          specialAllowance: Math.round(income * 0.25),
          other: Math.round(income * 0.15),
        },
        deductions80C: Math.floor(Math.random() * 150000),
        deductions80D: Math.floor(Math.random() * 25000),
        homeLoanInterest: Math.floor(Math.random() * 200000),
        educationLoanInterest: 0,
        rentPaid: Math.floor(Math.random() * 120000) + 60000,
        taxableIncome: Math.round(income * 0.7),
        currentTax: Math.round(income * 0.08),
        potentialSavings: Math.floor(Math.random() * 30000) + 5000,
        recommendedInvestments: ['PPF: ₹50,000', 'ELSS: ₹40,000', 'NPS: ₹50,000'],
      });

      // Insurance records
      insuranceRecords.push({
        userId: uId,
        healthScore: 70,
        healthStatus: 'Healthy',
        shortTermInvestment: 'FD',
        longTermInvestment: 'Mutual Funds',
        insuranceCoverageAmount: Math.floor(Math.random() * 3000000) + 1000000,
        recommendedInsurance: ['Comprehensive Health Insurance', 'Term Life Insurance'],
      });
    }

    await TaxAnalysis.insertMany(taxRecords);
    await Recommendation.insertMany(insuranceRecords);
    console.log('Successfully seeded Tax and Insurance sample data');

    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding process encountered error:', err.message);
    process.exit(1);
  }
};

seedData();
