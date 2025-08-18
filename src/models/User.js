const { pipe, pick, omit } = require('ramda');

const sanitizeUserData = omit(['password']);
const validateUserInput = pick(['username', 'email', 'password']);

const prepareUserForCreation = pipe(
  validateUserInput,
  user => ({
    ...user,
    username: user.username?.trim(),
    email: user.email?.toLowerCase().trim()
  })
);

const prepareUserForResponse = pipe(
  sanitizeUserData,
  pick(['id', 'username', 'email', 'created_at'])
);

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidUsername = (username) => {
  return username && username.length >= 3 && username.length <= 20;
};

const isValidPassword = (password) => {
  return password && password.length >= 6;
};

const validateUser = (validationRules) => (userData) => {
  const errors = [];
  
  validationRules.forEach(rule => {
    const result = rule(userData);
    if (result !== true) {
      errors.push(result);
    }
  });
  
  return errors.length === 0 ? { isValid: true } : { isValid: false, errors };
};

const userValidationRules = [
  (user) => isValidUsername(user.username) || 'Username must be between 3-20 characters',
  (user) => isValidEmail(user.email) || 'Invalid email format',
  (user) => isValidPassword(user.password) || 'Password must be at least 6 characters'
];

const loginValidationRules = [
  (user) => user.username && user.username.trim() || 'Username is required',
  (user) => user.password || 'Password is required'
];

const validateUserRegistration = validateUser(userValidationRules);
const validateUserLogin = validateUser(loginValidationRules);

module.exports = {
  prepareUserForCreation,
  prepareUserForResponse,
  validateUserRegistration,
  validateUserLogin,
  sanitizeUserData
};