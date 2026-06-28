const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    // req.user is set by the auth middleware
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No token, authorization denied' });
    }

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (!user.isPremium) {
      return res.status(403).json({
        status: 'error',
        message: 'Premium access required. Please upgrade your plan to access this feature.',
      });
    }

    // Pass user object to next handlers to save DB hits
    req.userObject = user;
    next();
  } catch (err) {
    console.error('Error in premiumAuth middleware:', err);
    res.status(500).json({ status: 'error', message: 'Server authorization check failed' });
  }
};
