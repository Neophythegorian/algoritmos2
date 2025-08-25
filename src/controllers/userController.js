const { curry, pipe } = require('ramda');
const { Result } = require('../utils/functional');
const { 
  prepareUserForCreation, 
  prepareUserForResponse, 
  validateUserRegistration, 
  validateUserLogin 
} = require('../models/User');

class ResponseHandler {
  static send(res, statusCode, data) {
    return res.status(statusCode).json(data);
  }

  static success(res, data) {
    return this.send(res, 200, data);
  }

  static created(res, data) {
    return this.send(res, 201, data);
  }

  static error(res, statusCode, message, details = null) {
    const errorResponse = { 
      error: message,
      timestamp: new Date().toISOString(),
      status: statusCode
    };
    
    if (details) {
      errorResponse.details = details;
    }
    
    return this.send(res, statusCode, errorResponse);
  }

  static badRequest(res, message, details) {
    return this.error(res, 400, message, details);
  }

  static unauthorized(res, message) {
    return this.error(res, 401, message || 'Unauthorized');
  }

  static notFound(res, message) {
    return this.error(res, 404, message || 'Resource not found');
  }

  static conflict(res, message) {
    return this.error(res, 409, message || 'Conflict');
  }

  static serverError(res, message) {
    return this.error(res, 500, message || 'Internal server error');
  }
}

class InputValidator {
  static validate(validator) {
    return (req, res, next) => {
      const validation = validator(req.body);
      if (!validation.isValid) {
        return ResponseHandler.badRequest(res, 'Validation failed', validation.errors);
      }
      next();
    };
  }

  static validateRegistration = this.validate(validateUserRegistration);
  static validateLogin = this.validate(validateUserLogin);
}

class ErrorMapper {
  static mapAuthError(error) {
    switch (error.message) {
      case 'User already exists':
        return { status: 409, message: 'User already exists' };
      case 'User not found':
      case 'Invalid credentials':
        return { status: 401, message: 'Invalid credentials' };
      case 'Session not found':
        return { status: 404, message: 'Session not found' };
      case 'Invalid or expired token':
        return { status: 401, message: 'Invalid or expired token' };
      default:
        return { status: 500, message: 'Authentication failed' };
    }
  }
}

class UserController {
  constructor(authService) {
    this.authService = authService;
  }

  registerUser = async (req, res) => {
    const userData = prepareUserForCreation(req.body);
    const result = await this.authService.registerUser(userData);
    
    result.fold(
      (error) => {
        const { status, message } = ErrorMapper.mapAuthError(error);
        return ResponseHandler.error(res, status, message);
      },
      (user) => {
        const responseData = prepareUserForResponse(user);
        return ResponseHandler.created(res, {
          message: 'User registered successfully',
          user: responseData
        });
      }
    );
  }

  loginUser = async (req, res) => {
    const credentials = req.body;
    const result = await this.authService.loginUser(credentials);
    
    result.fold(
      (error) => {
        const { status, message } = ErrorMapper.mapAuthError(error);
        return ResponseHandler.error(res, status, message);
      },
      ({ user, token }) => {
        return ResponseHandler.success(res, {
          access_token: token,
          user: prepareUserForResponse(user)
        });
      }
    );
  }

  logoutUser = async (req, res) => {
    const token = req.body.access_token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return ResponseHandler.badRequest(res, 'Access token required');
    }
    
    const result = await this.authService.logoutUser(token);
    
    result.fold(
      (error) => {
        const { status, message } = ErrorMapper.mapAuthError(error);
        return ResponseHandler.error(res, status, message);
      },
      (data) => ResponseHandler.success(res, data)
    );
  }

  getUserProfile = async (req, res) => {
    const token = req.body.access_token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return ResponseHandler.badRequest(res, 'Access token required');
    }
    
    const result = await this.authService.getUserProfile(token);
    
    result.fold(
      (error) => {
        const { status, message } = ErrorMapper.mapAuthError(error);
        return ResponseHandler.error(res, status, message);
      },
      (user) => ResponseHandler.success(res, prepareUserForResponse(user))
    );
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  ResponseHandler,
  InputValidator,
  ErrorMapper,
  UserController,
  asyncHandler
};