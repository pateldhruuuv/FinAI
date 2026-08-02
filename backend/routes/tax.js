const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const premiumAuth = require('../middleware/premiumAuth');
const taxController = require('../controllers/taxController');

// All routes require authentication and premium authorization
router.post('/calculate', auth, premiumAuth, taxController.calculateTax);
router.post('/compare', auth, premiumAuth, taxController.compareRegimes);
router.post('/recommend', auth, premiumAuth, taxController.getRecommendations);
router.post('/scenario', auth, premiumAuth, taxController.simulateScenario);
router.get('/history', auth, premiumAuth, taxController.getHistory);
router.get('/export/:id', auth, premiumAuth, taxController.exportPDFReport);
router.get('/report/:id', auth, premiumAuth, taxController.exportPDFReport);
router.delete('/history/:id', auth, premiumAuth, taxController.deleteHistory);

module.exports = router;
