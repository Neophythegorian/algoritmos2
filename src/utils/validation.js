const { curry, pipe } = require('ramda');

const isString = (value) => typeof value === 'string';
const isNumber = (value) => typeof value === 'number' && !isNaN(value);
const isBoolean = (value) => typeof value === 'boolean';
const isArray = (value) => Array.isArray(value);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isDefined = (value) => value !== undefined && value !== null;
const isEmpty = (value) => {
  if (isString(value)) return value.trim().length === 0;
  if (isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return !isDefined(value);
};

const hasMinLength = curry((min, value) => 
  isString(value) && value.length >= min
);

const hasMaxLength = curry((max, value) => 
  isString(value) && value.length <= max
);

const isInRange = curry((min, max, value) => 
  isNumber(value) && value >= min && value <= max
);

const matches = curry((regex, value) => 
  isString(value) && regex.test(value)
);

const isOneOf = curry((options, value) => options.includes(value));

const hasProperty = curry((prop, obj) => 
  isObject(obj) && obj.hasOwnProperty(prop)
);

const hasNestedProperty = curry((path, obj) => {
  return path.split('.').reduce((current, key) => {
    return current && current.hasOwnProperty(key) ? current[key] : undefined;
  }, obj) !== undefined;
});

const isValidEmail = matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

const isValidUrl = matches(/^https?:\/\/.+/);

const isAlphanumeric = matches(/^[a-zA-Z0-9]+$/);

const isValidUsername = matches(/^[a-zA-Z0-9_-]+$/);

const hasUppercase = matches(/[A-Z]/);
const hasLowercase = matches(/[a-z]/);
const hasNumber = matches(/\d/);
const hasSpecialChar = matches(/[!@#$%^&*(),.?":{}|<>]/);

const isStrongPassword = (value) => 
  isString(value) && 
  hasMinLength(8, value) && 
  hasUppercase(value) && 
  hasLowercase(value) && 
  hasNumber(value);

const isValidDate = (value) => {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};

const isAfterDate = curry((afterDate, value) => {
  if (!isValidDate(value)) return false;
  return new Date(value) > new Date(afterDate);
});

const isBeforeDate = curry((beforeDate, value) => {
  if (!isValidDate(value)) return false;
  return new Date(value) < new Date(beforeDate);
});

const hasMinItems = curry((min, array) => 
  isArray(array) && array.length >= min
);

const hasMaxItems = curry((max, array) => 
  isArray(array) && array.length <= max
);

const allItemsMatch = curry((predicate, array) => 
  isArray(array) && array.every(predicate)
);

const hasRequiredFields = curry((fields, obj) => 
  isObject(obj) && fields.every(field => hasProperty(field, obj) && isDefined(obj[field]))
);

const createValidator = (predicate, errorMessage) => (value) => 
  predicate(value) ? true : errorMessage;

const and = (...validators) => (value) => {
  for (const validator of validators) {
    const result = validator(value);
    if (result !== true) return result;
  }
  return true;
};

const or = (...validators) => (value) => {
  const errors = [];
  for (const validator of validators) {
    const result = validator(value);
    if (result === true) return true;
    errors.push(result);
  }
  return `All validations failed: ${errors.join(', ')}`;
};

const optional = (validator) => (value) => 
  isEmpty(value) ? true : validator(value);

const required = (validator) => (value) => 
  isEmpty(value) ? 'Field is required' : validator(value);

const createSchema = (schemaDefinition) => (data) => {
  const errors = {};
  let isValid = true;

  Object.keys(schemaDefinition).forEach(field => {
    const fieldValidators = schemaDefinition[field];
    const fieldValue = data[field];
    
    for (const validator of fieldValidators) {
      const result = validator(fieldValue);
      if (result !== true) {
        errors[field] = errors[field] || [];
        errors[field].push(result);
        isValid = false;
        break;
      }
    }
  });

  return { isValid, errors };
};

const userSchema = createSchema({
  username: [
    required(createValidator(isDefined, 'Username is required')),
    createValidator(isString, 'Username must be a string'),
    createValidator(hasMinLength(3), 'Username must be at least 3 characters'),
    createValidator(hasMaxLength(20), 'Username must be at most 20 characters'),
    createValidator(isValidUsername, 'Username can only contain letters, numbers, underscores, and hyphens')
  ],
  email: [
    required(createValidator(isDefined, 'Email is required')),
    createValidator(isString, 'Email must be a string'),
    createValidator(isValidEmail, 'Invalid email format')
  ],
  password: [
    required(createValidator(isDefined, 'Password is required')),
    createValidator(isString, 'Password must be a string'),
    createValidator(hasMinLength(6), 'Password must be at least 6 characters')
  ]
});

const gameSchema = createSchema({
  name: [
    required(createValidator(isDefined, 'Game name is required')),
    createValidator(isString, 'Game name must be a string'),
    createValidator(hasMinLength(3), 'Game name must be at least 3 characters'),
    createValidator(hasMaxLength(50), 'Game name must be at most 50 characters')
  ],
  rules: [
    optional(createValidator(isString, 'Rules must be a string'))
  ]
});

const sanitizeString = (value) => 
  isString(value) ? value.trim() : value;

const sanitizeEmail = (value) => 
  isString(value) ? value.toLowerCase().trim() : value;

const sanitizeNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? value : num;
};

const sanitizeBoolean = (value) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

const sanitizeObject = (sanitizers) => (obj) => {
  const sanitized = { ...obj };
  Object.keys(sanitizers).forEach(key => {
    if (sanitized.hasOwnProperty(key)) {
      sanitized[key] = sanitizers[key](sanitized[key]);
    }
  });
  return sanitized;
};

module.exports = {
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isDefined,
  isEmpty,
  hasMinLength,
  hasMaxLength,
  isInRange,
  matches,
  isOneOf,
  hasProperty,
  hasNestedProperty,
  isValidEmail,
  isValidUrl,
  isAlphanumeric,
  isValidUsername,
  isStrongPassword,
  isValidDate,
  isAfterDate,
  isBeforeDate,
  hasMinItems,
  hasMaxItems,
  allItemsMatch,
  hasRequiredFields,
  createValidator,
  and,
  or,
  optional,
  required,
  createSchema,
  userSchema,
  gameSchema,
  sanitizeString,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeBoolean,
  sanitizeObject
};