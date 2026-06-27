const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load models
const User = require('./models/User');
const Goal = require('./models/Goal');
const Trip = require('./models/Trip');
const DebtAnalysis = require('./models/DebtAnalysis');
const Forecast = require('./models/Forecast');

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finpilot';

const GOAL_NAMES = ['Buy Tesla', 'Dream House Pot', 'Education Fund', 'Emergency Fund', 'Retirement Pot', 'Goa Vacation', 'Marriage Expenses', 'New MacBook Pro', 'Medical Insurance Buffer', 'Bonds Investment Pool'];
const DESTINATIONS = ['Paris', 'Tokyo', 'Goa', 'New York', 'Bali', 'London', 'Switzerland', 'Singapore'];

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB at ${MONGO_URI}`);

    // Find or create a dummy user to assign records
    let user = await User.findOne({ email: 'seeduser@finpilot.com' });
    if (!user) {
      console.log('Creating seed dummy user...');
      user = new User({
        name: 'Seed Test User',
        email: 'seeduser@finpilot.com',
        password: '$2a$10$dummyhashedpasswordsecret1234567890', // dummy bcrypt hash
        age: 30,
        monthlyIncome: 100000,
      });
      await user.save();
    }
    const userId = user._id;
    console.log(`Using User ID: ${userId} for seed data`);

    // Clean existing seed records to prevent duplicates
    console.log('Cleaning old seed records...');
    await Goal.deleteMany({ userId });
    await Trip.deleteMany({ userId });
    await DebtAnalysis.deleteMany({ userId });
    await Forecast.deleteMany({ userId });

    const totalRecords = 500;

    // 1. Generate 500 Goals
    console.log('Generating 500 Goals...');
    const goalsList = [];
    for (let i = 0; i < totalRecords; i++) {
      const targetAmount = Math.floor(Math.random() * 480000) + 20000;
      const currentSavings = Math.floor(Math.random() * targetAmount);
      const progress = Math.min(Math.round((currentSavings / targetAmount) * 100), 100);
      
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + Math.floor(Math.random() * 48) + 6);

      goalsList.push({
        userId,
        goalName: `${GOAL_NAMES[i % GOAL_NAMES.length]} #${i + 1}`,
        targetAmount,
        currentSavings,
        targetDate,
        progress,
      });
    }
    await Goal.insertMany(goalsList);
    console.log(`Successfully seeded ${Goal.name} collection with 500 records`);

    // 2. Generate 500 Trips
    console.log('Generating 500 Trips...');
    const tripsList = [];
    for (let i = 0; i < totalRecords; i++) {
      const travelers = Math.floor(Math.random() * 4) + 1;
      const budget = Math.floor(Math.random() * 250000) + 50000;
      const estimatedCost = Math.floor(Math.random() * 220000) + 30000;
      const recommendation = estimatedCost <= budget ? 'Safe To Travel' : 'Not Recommended';
      
      const start = new Date();
      start.setDate(start.getDate() + Math.floor(Math.random() * 90) + 10);
      const end = new Date(start);
      end.setDate(end.getDate() + Math.floor(Math.random() * 10) + 3);

      tripsList.push({
        userId,
        destination: DESTINATIONS[i % DESTINATIONS.length],
        budget,
        estimatedCost,
        recommendation,
        numberOfTravelers: travelers,
        travelDates: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
      });
    }
    await Trip.insertMany(tripsList);
    console.log(`Successfully seeded ${Trip.name} collection with 500 records`);

    // 3. Generate 500 Debt Records
    console.log('Generating 500 Debt Records...');
    const debtList = [];
    for (let i = 0; i < totalRecords; i++) {
      const income = Math.floor(Math.random() * 150000) + 40000;
      const expenses = Math.floor(Math.random() * (income * 0.8)) + 15000;
      const totalDebt = Math.floor(Math.random() * 800000) + 10000;
      const emiAmount = Math.floor(Math.random() * 25000) + 2000;

      const dtiRatio = totalDebt / (income * 12);
      const emiRatio = emiAmount / income;
      const debtRiskScore = Math.min(Math.round((emiRatio * 60 + Math.min(dtiRatio, 2.0) / 2.0 * 40) * 100), 100);

      let category = 'Healthy';
      if (debtRiskScore >= 70) category = 'Critical';
      else if (debtRiskScore >= 35) category = 'Moderate';

      debtList.push({
        userId,
        monthlyIncome: income,
        monthlyExpenses: expenses,
        totalDebt,
        emiAmount,
        debtRiskScore,
        category,
        priorityList: [
          'Credit Card Outstandings - priority 1',
          'Unsecured Personal Loans - priority 2',
          'Asset Secured Car Loans - priority 3'
        ],
        repaymentPlan: `Current timeline requires approximately ${Math.round(totalDebt / emiAmount)} months. Extra debt payment of ₹${Math.round(Math.max(income - expenses, 0) * 0.2)} recommended.`,
      });
    }
    await DebtAnalysis.insertMany(debtList);
    console.log(`Successfully seeded ${DebtAnalysis.name} collection with 500 records`);

    // 4. Generate 500 Forecast Records
    console.log('Generating 500 Forecast Records...');
    const forecastList = [];
    for (let i = 0; i < totalRecords; i++) {
      const forecastType = i % 2 === 0 ? 'Savings' : 'Expenses';
      const baseVal = Math.floor(Math.random() * 80000) + 15000;

      forecastList.push({
        userId,
        forecastType,
        predicted3M: Math.round(baseVal * (1 + (Math.random() * 0.1 - 0.05))),
        predicted6M: Math.round(baseVal * (1 + (Math.random() * 0.2 - 0.1))),
        predicted12M: Math.round(baseVal * (1 + (Math.random() * 0.4 - 0.2))),
      });
    }
    await Forecast.insertMany(forecastList);
    console.log(`Successfully seeded ${Forecast.name} collection with 500 records`);

    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding process encountered error:', err.message);
    process.exit(1);
  }
};

seedData();
