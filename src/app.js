const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./config/database');
const { UserRepositoryFactory } = require('./repositories/userRepository');
const { AuthServiceFactory } = require('./services/authService');
const { UserController } = require('./controllers/userController');
const { pipe } = require('ramda');

class Application {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.database = null;
    this.userRepository = null;
    this.authService = null;
    this.userController = null;
  }

  async initialize() {
    try {
      this.database = await initializeDatabase();
      
      this.userRepository = UserRepositoryFactory.create(this.database);
      
      this.authService = AuthServiceFactory.create(this.userRepository);
      
      this.userController = new UserController(this.authService);
      
      this.setupMiddleware();
      this.setupRoutes();
      this.setupErrorHandling();
      
      return this;
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw error;
    }
  }

  setupMiddleware() {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
    });

    const middlewarePipeline = pipe(
      app => app.use(helmet()),
      app => app.use(cors()),
      app => app.use(limiter),
      app => app.use(express.json()),
      app => app.use(express.urlencoded({ extended: true }))
    );

    middlewarePipeline(this.app);
  }

  setupRoutes() {
    const userRouter = express.Router();
    
    userRouter.post('/register', 
      this.userController.registerUser
    );
    
    userRouter.post('/login', 
      this.userController.loginUser
    );
    
    userRouter.post('/logout', 
      this.userController.logoutUser
    );
    
    userRouter.get('/profile', 
      this.userController.getUserProfile
    );

    this.app.use('/api/users', userRouter);
    
    this.app.use('*', (req, res) => {
      res.status(404).json({ 
        error: 'Endpoint not found',
        timestamp: new Date().toISOString()
      });
    });
  }

  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      console.error('Unhandled error:', err.stack);
      res.status(500).json({ 
        error: 'Something went wrong!',
        timestamp: new Date().toISOString()
      });
    });
  }

  async start() {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.port, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Server running on port ${this.port}`);
          resolve(server);
        }
      });
    });
  }
}

const createApplication = async () => {
  const app = new Application();
  await app.initialize();
  return app;
};

const startServer = async () => {
  try {
    const app = await createApplication();
    await app.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { Application, createApplication };