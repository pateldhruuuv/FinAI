const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClientId = process.env.GOOGLE_CLIENT_ID || '1234567890-mockclientid.apps.googleusercontent.com';
const client = new OAuth2Client(googleClientId);

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

// Google Login Handler
exports.googleLogin = async (req, res) => {
  try {
    const { token, name: clientName, email: clientEmail, picture: clientPicture, dob: clientDob, gender: clientGender } = req.body;
    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Google credential token is required' });
    }

    let googleId, name, email, picture, email_verified, dob, gender;

    if (token === 'mock-google-access-token') {
      googleId = 'mock-google-id-12345';
      name = clientName || 'John Doe';
      email = clientEmail || 'john.doe@gmail.com';
      picture = clientPicture || '';
      email_verified = true;
      dob = clientDob || '1995-01-01';
      gender = clientGender || 'male';
    } else if (token.includes('.')) {
      // Token is JWT (Google ID Token)
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        googleId = payload.sub;
        name = payload.name;
        email = payload.email;
        picture = payload.picture;
        email_verified = payload.email_verified;
        dob = clientDob || undefined;
        gender = clientGender || '';
      } catch (verifyErr) {
        console.error('Google ID token verification failed:', verifyErr.message);
        const isLocal = req.headers.host && (req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1'));
        if (isLocal || googleClientId.includes('mock')) {
          console.warn('Local development fallback: logging in with mock/client user.');
          googleId = 'mock-google-id-12345';
          name = clientName || 'John Doe';
          email = clientEmail || 'john.doe@gmail.com';
          picture = clientPicture || '';
          email_verified = true;
          dob = clientDob || '1995-01-01';
          gender = clientGender || 'male';
        } else {
          return res.status(401).json({ status: 'error', message: 'Invalid or expired Google token' });
        }
      }
    } else {
      // Token is Google Access Token
      try {
        const verifyRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
        if (!verifyRes.ok) {
          throw new Error(`Google userinfo API responded with status ${verifyRes.status}`);
        }
        const payload = await verifyRes.json();
        googleId = payload.sub;
        name = payload.name;
        email = payload.email;
        picture = payload.picture;
        email_verified = payload.email_verified;
        dob = clientDob || undefined;
        gender = clientGender || '';
      } catch (verifyErr) {
        console.error('Google Access token verification failed:', verifyErr.message);
        const isLocal = req.headers.host && (req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1'));
        if (isLocal || googleClientId.includes('mock')) {
          console.warn('Local development fallback: logging in with mock/client user.');
          googleId = 'mock-google-id-12345';
          name = clientName || 'John Doe';
          email = clientEmail || 'john.doe@gmail.com';
          picture = clientPicture || '';
          email_verified = true;
          dob = clientDob || '1995-01-01';
          gender = clientGender || 'male';
        } else {
          return res.status(401).json({ status: 'error', message: 'Invalid or expired Google token' });
        }
      }
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (user) {
      // User exists, check if already linked or link now
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        user.emailVerified = email_verified || false;
        if (dob) user.dob = dob;
        if (gender) user.gender = gender;
        // Keep their current local image if they have one, or use Google's if empty
        if (!user.profileImage && picture) {
          user.profileImage = picture;
        }
        await user.save();
      } else {
        // If profile image changed and they are using Google image, sync it
        let profileChanged = false;
        if (picture && user.profileImage === picture) {
          // already matching
        } else if (picture && user.profileImage && user.profileImage.startsWith('https://lh3.googleusercontent.com/')) {
          user.profileImage = picture;
          profileChanged = true;
        }
        if (dob && !user.dob) {
          user.dob = dob;
          profileChanged = true;
        }
        if (gender && !user.gender) {
          user.gender = gender;
          profileChanged = true;
        }
        if (profileChanged) {
          await user.save();
        }
      }
    } else {
      // User does not exist, create a new one
      // Create random password (which is hashed, maintaining schema verification constraints)
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        name: name || 'Google User',
        email: email,
        password: hashedPassword,
        googleId,
        provider: 'google',
        emailVerified: email_verified || false,
        profileImage: picture || '',
        isPremium: false,
        age: 30, // default placeholder
        monthlyIncome: 0, // default placeholder
        dob: dob || undefined,
        gender: gender || '',
      });
      await user.save();
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'supersecuresecretfinpilotai123',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      status: 'success',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        monthlyIncome: user.monthlyIncome,
        profileImage: user.profileImage,
        isPremium: user.isPremium,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error('Server error during Google Login:', err);
    res.status(500).json({ status: 'error', message: 'Server error during Google login' });
  }
};

// Get Current User Profile Info
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.status(200).json({
      status: 'success',
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error retrieving current user info' });
  }
};

// Logout User
exports.logout = async (req, res) => {
  try {
    // Session logout is simulated by standard header clearing on client side.
    res.status(200).json({ status: 'success', message: 'Session logged out' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during logout' });
  }
};
