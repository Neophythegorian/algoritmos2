const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./config/database');
const { pipe } = require('ramda');


const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

const setupMiddleware = pipe(
  app => app.use(helmet()),
  app => app.use(cors()),
  app => app.use(limiter),
  app => app.use(express.json()),
  app => app.use(express.urlencoded({ extended: true }))
);

const setupRoutes = pipe(
  app => app.use('/api/users', userRoutes),
  app => app.use('/api/games', gameRoutes),
  app => app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  })
);

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};

const initializeApp = async () => {
  try {
    await initializeDatabase();
    
    setupMiddleware(app);
    
    setupRoutes(app);
    
    app.use(errorHandler);
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

initializeApp();

module.exports = app;