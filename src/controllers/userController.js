const { curry, pipe } = require('ramda');
const authService = require('../services/authService');
const { 
  prepareUserForCreation, 
  prepareUserForResponse, 
  validateUserRegistration, 
  validateUserLogin 
} = require('../models/User');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const sendResponse = curry((statusCode, res, data) => {
  res.status(statusCode).json(data);
});

const sendSuccess = sendResponse(200);
const sendCreated = sendResponse(201);
const sendError = curry((statusCode, res, message) => {
  res.status(statusCode).json({ error: message });
});

const sendBadRequest = sendError(400);
const sendUnauthorized = sendError(401);
const sendNotFound = sendError(404);
const sendConflict = sendError(409);
const sendServerError = sendError(500);

const validateInput = (validator) => (req, res, next) => {
  const validation = validator(req.body);
  if (!validation.isValid) {
    return sendBadRequest(res, validation.errors.join(', '));
  }
  next();
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const userData = prepareUserForCreation(req.body);
    const user = await authService.registerUser(userData);
    const responseData = prepareUserForResponse(user);
    
    sendCreated(res, {
      message: 'User registered successfully',
      user: responseData
    });
  } catch (error) {
    if (error.message === 'User already exists') {
      return sendConflict(res, 'User already exists');
    }
    sendServerError(res, 'Registration failed');
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const credentials = req.body;
    const { user, token } = await authService.loginUser(credentials);
    
    sendSuccess(res, {
      access_token: token,
      user: prepareUserForResponse(user)
    });
  } catch (error) {
    if (error.message === 'User not found' || error.message === 'Invalid credentials') {
      return sendUnauthorized(res, 'Invalid credentials');
    }
    sendServerError(res, 'Login failed');
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    const token = req.body.access_token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return sendBadRequest(res, 'Access token required');
    }
    
    const result = await authService.logoutUser(token);
    sendSuccess(res, result);
  } catch (error) {
    if (error.message === 'Session not found') {
      return sendNotFound(res, 'Session not found');
    }
    sendServerError(res, 'Logout failed');
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const token = req.body.access_token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return sendBadRequest(res, 'Access token required');
    }
    
    const user = await authService.getUserProfile(token);
    sendSuccess(res, prepareUserForResponse(user));
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      return sendUnauthorized(res, 'Invalid or expired token');
    }
    sendServerError(res, 'Failed to get user profile');
  }
});

const createControllerPipeline = (...middlewares) => {
  return middlewares.reduce((acc, middleware) => {
    return (req, res, next) => acc(req, res, (err) => {
      if (err) return next(err);
      middleware(req, res, next);
    });
  });
};

const validateRegistration = validateInput(validateUserRegistration);
const validateLogin = validateInput(validateUserLogin);

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  validateRegistration,
  validateLogin,
  asyncHandler,
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendUnauthorized,
  sendNotFound,
  sendConflict,
  sendServerError
};