const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, extractTokenFromBody } = require('../services/authService');

router.post(
  '/register',
  userController.validateRegistration,
  userController.registerUser
);

router.post(
  '/login',
  userController.validateLogin,
  userController.loginUser
);

router.post(
  '/logout',
  extractTokenFromBody,
  userController.logoutUser
);

router.get(
  '/profile',
  extractTokenFromBody,
  authenticateToken,
  userController.getUserProfile
);

module.exports = router;
