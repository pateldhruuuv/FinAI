const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  age: {
    type: Number,
    required: false,
    min: [18, 'Age must be at least 18'],
  },
  monthlyIncome: {
    type: Number,
    required: false,
    default: 0,
    min: [0, 'Monthly income cannot be negative'],
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  googleId: {
    type: String,
    required: false,
  },
  provider: {
    type: String,
    default: 'email', // 'email' or 'google'
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
    default: '',
  },
  profileImage: {
    type: String,
    default: '',
  },
  dob: {
    type: Date,
    required: false,
  },
  gender: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    default: '',
  },
  country: {
    type: String,
    default: '',
  },
  occupation: {
    type: String,
    default: '',
  },
  monthlyExpenses: {
    type: Number,
    default: 0,
    min: [0, 'Expenses cannot be negative'],
  },
  savings: {
    type: Number,
    default: 0,
    min: [0, 'Savings cannot be negative'],
  },
  emergencyFund: {
    type: Number,
    default: 0,
    min: [0, 'Emergency fund cannot be negative'],
  },
  riskProfile: {
    type: String,
    default: 'Moderate',
  },
  investmentExperience: {
    type: String,
    default: 'Intermediate',
  },
  investmentGoal: {
    type: String,
    default: '',
  },
  retirementAge: {
    type: Number,
    default: 60,
  },
  dependents: {
    type: Number,
    default: 0,
    min: [0, 'Dependents count cannot be negative'],
  },
  theme: {
    type: String,
    default: 'dark',
  },
  language: {
    type: String,
    default: 'en',
  },
  currency: {
    type: String,
    default: 'INR',
  },
  dashboardLayout: {
    type: String,
    default: 'grid',
  },
  defaultLandingPage: {
    type: String,
    default: 'dashboard',
  },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    investmentAlerts: { type: Boolean, default: true },
    billReminders: { type: Boolean, default: true },
    subscriptionRenewal: { type: Boolean, default: true },
    goalAchievement: { type: Boolean, default: true },
    marketNews: { type: Boolean, default: true },
    aiRecommendation: { type: Boolean, default: true },
  },
  dataSharingConsent: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);

