const jwt = require('jsonwebtoken');
const Researcher = require('../db/models/Researcher');

const authenticateResearcher = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const secret = process.env.JWT_SECRET || 'cognis_default_secret_key_2026';
    const decoded = jwt.verify(token, secret);

    const researcher = await Researcher.findById(decoded.id);
    if (!researcher) {
      return res.status(401).json({
        success: false,
        message: 'Researcher not found or token invalid.',
      });
    }

    req.researcher = researcher;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
};

module.exports = {
  authenticateResearcher,
};
