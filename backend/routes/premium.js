const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const premiumAuth = require('../middleware/premiumAuth');
const premiumController = require('../controllers/premiumController');

// All routes here require authentication and premium authorization
router.post('/tax-optimizer', auth, premiumAuth, premiumController.getTaxOptimization);
router.post('/loan-advisor', auth, premiumAuth, premiumController.getLoanAdvice);
router.post('/insurance-gap', auth, premiumAuth, premiumController.getInsuranceGapAnalysis);
router.post('/portfolio-risk', auth, premiumAuth, premiumController.getPortfolioRiskAnalysis);
router.post('/financial-report', auth, premiumAuth, premiumController.generateFinancialReport);
router.post('/what-if', auth, premiumAuth, premiumController.runWhatIfSimulation);
router.post('/financial-coach', auth, premiumAuth, premiumController.getFinancialCoachAdvice);
router.get('/premium-dashboard', auth, premiumAuth, premiumController.getPremiumDashboardData);
router.post('/recommend-stocks', auth, premiumAuth, premiumController.recommendStocks);

module.exports = router;
