const jwt = require('jsonwebtoken');
const Researcher = require('../db/models/Researcher');

// Helper to generate JWT
const generateToken = (researcher) => {
  const secret = process.env.JWT_SECRET || 'cognis_default_secret_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: researcher._id,
      email: researcher.email,
      role: researcher.role,
    },
    secret,
    { expiresIn }
  );
};

// 1. Researcher Registration
const register = async (req, res) => {
  try {
    const { name, email, password, institution, fieldOfStudy } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await Researcher.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this institutional/research email already exists.',
      });
    }

    const researcher = new Researcher({
      name: name.trim(),
      email: normalizedEmail,
      password,
      institution: institution ? institution.trim() : '',
      fieldOfStudy: fieldOfStudy ? fieldOfStudy.trim() : '',
      authProvider: 'local',
      isEmailVerified: false,
    });

    await researcher.save();

    const token = generateToken(researcher);

    return res.status(201).json({
      success: true,
      message: 'Researcher registered successfully.',
      token,
      researcher,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

// 2. Researcher Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find researcher with password included for check
    const researcher = await Researcher.findOne({ email: normalizedEmail }).select('+password');

    if (!researcher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if account was created via Google without a password
    if (!researcher.password && researcher.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account is linked with Google. Please use Google Sign-In.',
      });
    }

    const isMatch = await researcher.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(researcher);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      researcher: researcher.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

// 3. Google OAuth Verification & Sign-In/Sign-Up
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential ID token is required.',
      });
    }

    // Verify ID token directly with Google's tokeninfo API
    const googleResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!googleResponse.ok) {
      const errorData = await googleResponse.json().catch(() => ({}));
      return res.status(400).json({
        success: false,
        message: errorData.error_description || 'Invalid or expired Google token.',
      });
    }

    const googlePayload = await googleResponse.json();

    // Verify Audience against configured Client ID if set
    const configuredClientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : '';
    if (configuredClientId && googlePayload.aud !== configuredClientId) {
      console.warn('Google Client ID mismatch:', { tokenAud: googlePayload.aud, configured: configuredClientId });
      return res.status(401).json({
        success: false,
        message: `Google token audience mismatch.`,
      });
    }

    const { sub, email, name, picture, email_verified } = googlePayload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No verified email found in Google profile.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if researcher exists by email or googleId
    let researcher = await Researcher.findOne({
      $or: [{ email: normalizedEmail }, { googleId: sub }],
    });

    if (researcher) {
      // Update Google ID or avatar if not already set
      if (!researcher.googleId && sub) researcher.googleId = sub;
      if (!researcher.avatar && picture) researcher.avatar = picture;
      if (email_verified) researcher.isEmailVerified = true;
      await researcher.save();
    } else {
      // Create new Researcher from Google account
      researcher = new Researcher({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        googleId: sub,
        avatar: picture || '',
        authProvider: 'google',
        role: 'researcher',
        isEmailVerified: email_verified === 'true' || email_verified === true,
      });
      await researcher.save();
    }

    const token = generateToken(researcher);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful.',
      token,
      researcher: researcher.toJSON(),
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during Google authentication.',
    });
  }
};

// 4. Get Current Researcher Profile (Protected)
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      researcher: req.researcher,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch researcher profile.',
    });
  }
};

// 5. Update Profile (Institution / Field of Study)
const updateProfile = async (req, res) => {
  try {
    const { name, institution, fieldOfStudy } = req.body;
    const researcher = req.researcher;

    if (name) researcher.name = name.trim();
    if (institution !== undefined) researcher.institution = institution.trim();
    if (fieldOfStudy !== undefined) researcher.fieldOfStudy = fieldOfStudy.trim();

    await researcher.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      researcher: researcher.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile.',
    });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  getMe,
  updateProfile,
};
