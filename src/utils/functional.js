const { curry, pipe, compose, map, filter, reduce } = require('ramda');

const Result = {
  success: (value) => ({
    isSuccess: true,
    isFailure: false,
    value,
    error: null,
    map: (fn) => {
      try {
        return Result.success(fn(value));
      } catch (error) {
        return Result.failure(error);
      }
    },
    flatMap: (fn) => {
      try {
        return fn(value);
      } catch (error) {
        return Result.failure(error);
      }
    },
    mapError: () => Result.success(value),
    fold: (onFailure, onSuccess) => onSuccess(value),
    getOrElse: () => value
  }),
  
  failure: (error) => ({
    isSuccess: false,
    isFailure: true,
    value: null,
    error,
    map: () => Result.failure(error),
    flatMap: () => Result.failure(error),
    mapError: (fn) => Result.failure(fn(error)),
    fold: (onFailure, onSuccess) => onFailure(error),
    getOrElse: (defaultValue) => defaultValue
  })
};

const tryCatch = (fn) => (...args) => {
  try {
    const result = fn(...args);
    if (result && typeof result.then === 'function') {
      return result
        .then(value => Result.success(value))
        .catch(error => Result.failure(error));
    }
    return Result.success(result);
  } catch (error) {
    return Result.failure(error);
  }
};

// ===== RESTO DEL CÓDIGO EXISTENTE =====
const log = curry((prefix, message) => {
  console.log(`[${prefix}] ${message}`);
  return message;
});

const handleError = curry((errorType, error) => {
  console.error(`[${errorType}] ${error.message}`);
  throw error;
});

const Maybe = {
  of: (value) => ({
    map: (fn) => value ? Maybe.of(fn(value)) : Maybe.nothing(),
    flatMap: (fn) => value ? fn(value) : Maybe.nothing(),
    filter: (predicate) => value && predicate(value) ? Maybe.of(value) : Maybe.nothing(),
    getOrElse: (defaultValue) => value || defaultValue,
    isNothing: () => !value,
    isSomething: () => !!value
  }),
  nothing: () => ({
    map: () => Maybe.nothing(),
    flatMap: () => Maybe.nothing(),
    filter: () => Maybe.nothing(),
    getOrElse: (defaultValue) => defaultValue,
    isNothing: () => true,
    isSomething: () => false
  })
};

const Either = {
  right: (value) => ({
    map: (fn) => Either.right(fn(value)),
    flatMap: (fn) => fn(value),
    fold: (leftFn, rightFn) => rightFn(value),
    isLeft: () => false,
    isRight: () => true
  }),
  left: (error) => ({
    map: () => Either.left(error),
    flatMap: () => Either.left(error),
    fold: (leftFn, rightFn) => leftFn(error),
    isLeft: () => true,
    isRight: () => false
  })
};

const asyncPipe = (...fns) => (value) => 
  fns.reduce((acc, fn) => acc.then(fn), Promise.resolve(value));

const asyncCompose = (...fns) => asyncPipe(...fns.reverse());

const mapAsync = curry(async (fn, array) => {
  return Promise.all(array.map(fn));
});

const filterAsync = curry(async (predicate, array) => {
  const results = await Promise.all(array.map(predicate));
  return array.filter((_, index) => results[index]);
});

const reduceAsync = curry(async (fn, initialValue, array) => {
  let acc = initialValue;
  for (const item of array) {
    acc = await fn(acc, item);
  }
  return acc;
});

const safeCompose = (...fns) => (value) => {
  try {
    return pipe(...fns)(value);
  } catch (error) {
    return Either.left(error);
  }
};

const retry = curry((maxAttempts, delay, fn) => async (...args) => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      return await fn(...args);
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
});

const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const debounce = curry((delay, fn) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
});

const throttle = curry((delay, fn) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
  };
});

const partial = (fn, ...args1) => (...args2) => fn(...args1, ...args2);

const validateAndTransform = curry((validators, transformers, data) => {
  const validationResults = validators.map(validator => validator(data));
  const errors = validationResults.filter(result => result !== true);
  
  if (errors.length > 0) {
    return Either.left(errors);
  }
  
  try {
    const transformed = pipe(...transformers)(data);
    return Either.right(transformed);
  } catch (error) {
    return Either.left([error.message]);
  }
});

const when = curry((predicate, fn, value) => 
  predicate(value) ? fn(value) : value
);

const unless = curry((predicate, fn, value) => 
  !predicate(value) ? fn(value) : value
);

const chunk = curry((size, array) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
});

const unique = (array) => [...new Set(array)];

const flatten = (array) => array.reduce((acc, val) => 
  Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []
);

const pick = curry((keys, obj) => 
  keys.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {})
);

const omit = curry((keys, obj) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
});

module.exports = {
  Result,
  tryCatch,
  log,
  handleError,
  Maybe,
  Either,
  asyncPipe,
  asyncCompose,
  mapAsync,
  filterAsync,
  reduceAsync,
  safeCompose,
  retry,
  memoize,
  debounce,
  throttle,
  partial,
  validateAndTransform,
  when,
  unless,
  chunk,
  unique,
  flatten,
  pick,
  omit
};