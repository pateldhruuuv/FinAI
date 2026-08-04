const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');

// @route   POST /recommend-investment
// @desc    Get investment recommendations from FastAPI
// @access  Private
router.post('/recommend-investment', auth, aiController.recommendInvestment);

// @route   POST /recommend-insurance
// @desc    Get insurance recommendations from FastAPI
// @access  Private
router.post('/recommend-insurance', auth, aiController.recommendInsurance);

// @route   POST /predict-health
// @desc    Predict financial health status
// @access  Private
router.post('/predict-health', auth, aiController.predictHealth);
router.post('/ai/diagnostics', auth, aiController.predictHealth);

// @route   POST /chat
// @desc    Chat with Gemini-powered financial advisor
// @access  Private
router.post('/chat', auth, aiController.chat);

module.exports = router;
