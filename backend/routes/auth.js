const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const auth = require('../middleware/auth');

// @route   POST /auth/register
// @desc    Register a user
// @access  Public
router.post('/register', authController.register);

// @route   POST /auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   POST /auth/toggle-premium
// @desc    Toggle premium tier status for testing
// @access  Private
router.post('/toggle-premium', auth, authController.togglePremium);

// @route   PUT /auth/profile
// @desc    Update user profile details (age, income)
// @access  Private
router.put('/profile', auth, authController.updateProfile);

// @route   POST /auth/google
// @desc    Authenticate with Google OAuth
// @access  Public
router.post('/google', authController.googleLogin);

// @route   GET /auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, authController.getMe);

// @route   POST /auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, authController.logout);

module.exports = router;
