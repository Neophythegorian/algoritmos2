const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { curry, pipe } = require('ramda');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

const hashPassword = curry(async (saltRounds, password) => {
  return bcrypt.hash(password, saltRounds);
});

const comparePassword = curry(async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
});

const generateToken = curry((secret, expiresIn, payload) => {
  return jwt.sign(payload, secret, { expiresIn });
});

const verifyToken = curry((secret, token) => {
  return jwt.verify(token, secret);
});

const withPasswordHashing = (createUserFn) => async (userData) => {
  const hashedPassword = await hashPassword(10, userData.password);
  return createUserFn({
    ...userData,
    password: hashedPassword
  });
};

const withPasswordVerification = (loginFn) => async (credentials, user) => {
  const isValidPassword = await comparePassword(credentials.password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  return loginFn(user);
};

const createAccessToken = generateToken(JWT_SECRET, JWT_EXPIRY);

const createSessionToken = async (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email
  };
  
  const token = createAccessToken(payload);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  await userRepository.createSession(user.id, token, expiresAt);
  return token;
};

const validateAccessToken = async (token) => {
  try {
    const decoded = verifyToken(JWT_SECRET, token);
    const session = await userRepository.findSessionByToken(token);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    return {
      user: {
        id: session.user_id,
        username: session.username,
        email: session.email
      },
      session
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

const registerUser = pipe(
  withPasswordHashing(userRepository.createUser)
);

const loginUser = async (credentials) => {
  const user = await userRepository.withUserFound(async (foundUser) => {
    return withPasswordVerification(async (validUser) => {
      const token = await createSessionToken(validUser);
      return { user: validUser, token };
    })(credentials, foundUser);
  })(credentials.username);
  
  return user;
};

const logoutUser = async (token) => {
  const success = await userRepository.invalidateSession(token);
  if (!success) {
    throw new Error('Session not found');
  }
  return { message: 'User logged out successfully' };
};

const getUserProfile = async (token) => {
  const { user } = await validateAccessToken(token);
  return user;
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const { user } = await validateAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }
};

const extractTokenFromBody = (req, res, next) => {
  if (req.body.access_token) {
    req.headers.authorization = `Bearer ${req.body.access_token}`;
  }
  next();
};

const cleanupExpiredSessions = async () => {
  try {
    const deletedCount = await userRepository.cleanExpiredSessions();
    console.log(`Cleaned up ${deletedCount} expired sessions`);
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
};

setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  validateAccessToken,
  authenticateToken,
  extractTokenFromBody,
  hashPassword: hashPassword(10),
  comparePassword,
  createAccessToken,
  cleanupExpiredSessions
};