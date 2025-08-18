const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { curry, pipe } = require('ramda');

const DB_PATH = path.join(__dirname, '../../database.sqlite');

let db = null;

const query = curry((sql, params, callback) => {
  if (!db) {
    return callback(new Error('Database not initialized'));
  }
  
  if (sql.trim().toLowerCase().startsWith('select')) {
    db.all(sql, params, callback);
  } else {
    db.run(sql, params, callback);
  }
});

const withTransaction = (operation) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      operation()
        .then(result => {
          db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve(result);
          });
        })
        .catch(error => {
          db.run('ROLLBACK', (rollbackErr) => {
            reject(error);
          });
        });
    });
  });
};

const queryAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables()
          .then(() => resolve())
          .catch(reject);
      }
    });
  });
};

const createTables = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createGamesTable = `
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rules TEXT,
      state TEXT DEFAULT 'waiting',
      creator_id INTEGER,
      current_player_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users (id),
      FOREIGN KEY (current_player_id) REFERENCES users (id)
    )
  `;

  const createGamePlayersTable = `
    CREATE TABLE IF NOT EXISTS game_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER,
      user_id INTEGER,
      score INTEGER DEFAULT 0,
      is_ready BOOLEAN DEFAULT FALSE,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(game_id, user_id)
    )
  `;

  const createCardsTable = `
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER,
      card_type TEXT NOT NULL,
      card_value TEXT NOT NULL,
      card_color TEXT,
      position TEXT DEFAULT 'deck',
      player_id INTEGER,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games (id),
      FOREIGN KEY (player_id) REFERENCES users (id)
    )
  `;

  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `;

  try {
    await queryAsync(createUsersTable);
    await queryAsync(createGamesTable);
    await queryAsync(createGamePlayersTable);
    await queryAsync(createCardsTable);
    await queryAsync(createSessionsTable);
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const closeDatabase = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
};

module.exports = {
  initializeDatabase,
  queryAsync,
  withTransaction,
  closeDatabase,
  query
};