const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, age, monthlyIncome } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      name,
      email,
      password: hashedPassword,
      age: age !== undefined ? parseInt(age) : undefined,
      monthlyIncome: monthlyIncome !== undefined ? parseFloat(monthlyIncome) : undefined,
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'supersecuresecretfinpilotai123',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      status: 'success',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        monthlyIncome: user.monthlyIncome,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during registration' });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'supersecuresecretfinpilotai123',
      { expiresIn: '7d' }
    );

    res.json({
      status: 'success',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        monthlyIncome: user.monthlyIncome,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during login' });
  }
};

// Toggle Premium Status
exports.togglePremium = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Once premium, there is no going back
    user.isPremium = true;
    await user.save();

    res.json({
      status: 'success',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        monthlyIncome: user.monthlyIncome,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error upgrading premium status' });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { age, monthlyIncome } = req.body;
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    if (age !== undefined) user.age = parseInt(age);
    if (monthlyIncome !== undefined) user.monthlyIncome = parseFloat(monthlyIncome);
    
    await user.save();

    res.json({
      status: 'success',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        monthlyIncome: user.monthlyIncome,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error updating profile' });
  }
};
