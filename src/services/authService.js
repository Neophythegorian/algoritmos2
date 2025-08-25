const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { curry, pipe } = require('ramda');
const { Result, tryCatch } = require('../utils/functional');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

class PasswordService {
  constructor(saltRounds = 10) {
    this.saltRounds = saltRounds;
  }

  async hash(password) {
    return tryCatch(async () => {
      return await bcrypt.hash(password, this.saltRounds);
    })();
  }

  async compare(password, hashedPassword) {
    return tryCatch(async () => {
      return await bcrypt.compare(password, hashedPassword);
    })();
  }
}

class TokenService {
  constructor(secret, expiry) {
    this.secret = secret;
    this.expiry = expiry;
  }

  generate(payload) {
    return tryCatch(() => {
      return jwt.sign(payload, this.secret, { expiresIn: this.expiry });
    })();
  }

  verify(token) {
    return tryCatch(() => {
      return jwt.verify(token, this.secret);
    })();
  }
}

class AuthService {
  constructor(userRepository, passwordService, tokenService) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
    this.tokenService = tokenService;
  }

  async registerUser(userData) {
    const hashResult = await this.passwordService.hash(userData.password);
    
    return hashResult.flatMap(async (hashedPassword) => {
      const userToCreate = { ...userData, password: hashedPassword };
      return await this.userRepository.write.create(userToCreate);
    });
  }

  async loginUser(credentials) {
    const userResult = await this.userRepository.read.findByUsername(credentials.username);
    
    return userResult.flatMap(async (users) => {
      if (!users || users.length === 0) {
        return Result.failure(new Error('User not found'));
      }

      const user = users[0];
      const passwordResult = await this.passwordService.compare(credentials.password, user.password);
      
      return passwordResult.flatMap(async (isValid) => {
        if (!isValid) {
          return Result.failure(new Error('Invalid credentials'));
        }

        const tokenResult = await this.createSessionToken(user);
        return tokenResult.map(token => ({ user, token }));
      });
    });
  }

  async createSessionToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email
    };
    
    const tokenResult = this.tokenService.generate(payload);
    
    return tokenResult.flatMap(async (token) => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const sessionResult = await this.userRepository.write.createSession(user.id, token, expiresAt);
      return sessionResult.map(() => token);
    });
  }

  async validateAccessToken(token) {
    const sessionResult = await this.userRepository.read.findSessionByToken(token);
    
    return sessionResult.flatMap(async (session) => {
      if (!session) {
        return Result.failure(new Error('Session not found'));
      }

      const tokenResult = this.tokenService.verify(token);
      return tokenResult.map(() => ({
        user: {
          id: session.user_id,
          username: session.username,
          email: session.email
        },
        session
      }));
    });
  }

  async logoutUser(token) {
    const result = await this.userRepository.write.invalidateSession(token);
    return result.map(() => ({ message: 'User logged out successfully' }));
  }

  async getUserProfile(token) {
    const validationResult = await this.validateAccessToken(token);
    return validationResult.map(({ user }) => user);
  }
}

class AuthServiceFactory {
  static create(userRepository) {
    const passwordService = new PasswordService();
    const tokenService = new TokenService(JWT_SECRET, JWT_EXPIRY);
    return new AuthService(userRepository, passwordService, tokenService);
  }
}

const authenticateToken = (authService) => async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  const result = await authService.validateAccessToken(token);
  
  result.fold(
    (error) => res.status(403).json({ error: error.message }),
    ({ user }) => {
      req.user = user;
      next();
    }
  );
};

const extractTokenFromBody = (req, res, next) => {
  if (req.body.access_token) {
    req.headers.authorization = `Bearer ${req.body.access_token}`;
  }
  next();
};

module.exports = {
  PasswordService,
  TokenService,
  AuthService,
  AuthServiceFactory,
  authenticateToken,
  extractTokenFromBody
};