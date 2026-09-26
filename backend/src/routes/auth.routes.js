const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateResearcher } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);

// Protected routes (JWT required)
router.get('/me', authenticateResearcher, authController.getMe);
router.put('/profile', authenticateResearcher, authController.updateProfile);

module.exports = router;
