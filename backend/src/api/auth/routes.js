// src/api/auth/routes.js
const express = require('express');
const router = express.Router();
const authController = require('./controller');
const { protect } = require('../../middleware/auth');
const { validateRegister, validateLogin, validatePassword, validateWallet } = require('../../middleware/validation');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', validatePassword, authController.resetPassword);

// Protected routes (require authentication)
router.use(protect); // All routes after this middleware require authentication
router.get('/me', authController.getMe);
router.patch('/update-password', validatePassword, authController.updatePassword);
router.post('/link-wallet', validateWallet, authController.linkWallet);

module.exports = router;