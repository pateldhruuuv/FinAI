const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const plannerController = require('../controllers/plannerController');

// Goal planner routes
router.post('/goals/create', auth, plannerController.createGoal);
router.post('/goals', auth, plannerController.createGoal);
router.get('/goals', auth, plannerController.getGoals);

// Emergency fund routes
router.get('/emergency-fund', auth, plannerController.calculateEmergencyFund);

// Trip planner routes
router.post('/trip-planner', auth, plannerController.planTrip);

// Debt rescue routes
router.post('/debt-analysis', auth, plannerController.analyzeDebt);

// Subscription analyzer route
router.get('/subscriptions/analyze', auth, plannerController.analyzeSubscriptions);

// Retirement plan route
router.post('/retirement-plan', auth, plannerController.calculateRetirement);

// Forecasting route
router.post('/forecast', auth, plannerController.getForecast);

// Recommendation engine routes
router.get('/recommendations', auth, plannerController.getRecommendations);

// Smart notifications routes
router.get('/notifications', auth, plannerController.getNotifications);
router.post('/notifications/read', auth, plannerController.markNotificationsRead);

// Spending insights route
router.get('/spending-insights', auth, plannerController.getSpendingInsights);

module.exports = router;
