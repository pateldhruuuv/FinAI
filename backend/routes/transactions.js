const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

const router = express.Router();

// Multer configuration for temporary CSV storage
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /csv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.originalname.endsWith('.csv');

    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'));
    }
  },
});

// @route   POST /upload-statement
// @desc    Upload bank statement CSV and save transactions
// @access  Private
router.post('/upload-statement', auth, upload.single('statement'), transactionController.uploadStatement);

// @route   GET /dashboard
// @desc    Get dashboard metrics, charts data, and financial score
// @access  Private
router.get('/dashboard', auth, transactionController.getDashboard);

module.exports = router;
