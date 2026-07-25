const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');
const statementController = require('../controllers/statementController');

const router = express.Router();

// Multer configuration for CSV, Excel, and PDF storage
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /csv|xlsx|xls|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || 
                     file.originalname.endsWith('.csv') || 
                     file.originalname.endsWith('.xlsx') || 
                     file.originalname.endsWith('.xls') || 
                     file.originalname.endsWith('.pdf');

    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV, Excel (XLSX/XLS), and PDF files are allowed!'));
    }
  },
});

// @route   POST /upload-statement
// @desc    Upload bank statement (CSV, XLSX, PDF) and process with AI Engine
// @access  Private
router.post('/upload-statement', auth, upload.single('statement'), statementController.uploadStatement);

// @route   GET /transactions
// @desc    Get all normalized transactions
// @access  Private
router.get('/transactions', auth, statementController.getTransactions);

// @route   GET /subscriptions
// @desc    Get detected subscriptions
// @access  Private
router.get('/subscriptions', auth, statementController.getSubscriptions);

// @route   GET /merchant-analysis
// @desc    Get detailed merchant analysis & Seaborn chart images
// @access  Private
router.get('/merchant-analysis', auth, statementController.getMerchantAnalysis);

// @route   GET /expense-summary
// @desc    Get detailed expense analytics summary & cash flow
// @access  Private
router.get('/expense-summary', auth, statementController.getExpenseSummary);

// @route   POST /update-category
// @desc    Correct transaction category and update learning database
// @access  Private
router.post('/update-category', auth, statementController.updateCategory);

// @route   GET /dashboard
// @desc    Get dashboard metrics, charts data, and financial score
// @access  Private
router.get('/dashboard', auth, transactionController.getDashboard);

module.exports = router;

