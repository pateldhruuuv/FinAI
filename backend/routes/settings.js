const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

// Configure Multer Disk Storage for profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile_pics');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile_${req.user}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, JPEG, PNG, GIF) are allowed!'));
    }
  }
});

// Profile endpoints
router.get('/profile', auth, settingsController.getProfile);
router.put('/profile', auth, settingsController.updateProfile);
router.put('/financial-profile', auth, settingsController.updateFinancialProfile);
router.put('/preferences', auth, settingsController.updatePreferences);
router.put('/notifications', auth, settingsController.updateNotifications);

// Security endpoints
router.put('/security/change-password', auth, settingsController.changePassword);

// Profile image upload endpoint
router.post('/upload-profile-image', auth, upload.single('image'), settingsController.uploadProfileImage);

// Linked Accounts endpoints
router.get('/linked-accounts', auth, settingsController.getLinkedAccounts);
router.post('/linked-accounts', auth, settingsController.addLinkedAccount);
router.delete('/linked-accounts/:id', auth, settingsController.removeLinkedAccount);
router.post('/linked-accounts/refresh', auth, settingsController.refreshLinkedAccounts);

// Privacy endpoints
router.post('/privacy/download-data', auth, settingsController.downloadPersonalData);
router.post('/privacy/delete-statements', auth, settingsController.deleteUploadedStatements);
router.put('/privacy/sharing-consent', auth, settingsController.updateSharingConsent);
router.delete('/account', auth, settingsController.deleteAccount);

// Document & report compilation endpoints
router.post('/settings/reports', auth, settingsController.downloadSettingsReport);

module.exports = router;
