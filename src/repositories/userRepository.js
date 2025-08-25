const { queryAsync } = require('../config/database');
const { curry, pipe } = require('ramda');
const { Result, tryCatch } = require('../utils/functional');
const { IUserReadRepository, IUserWriteRepository } = require('./interfaces');

class UserReadRepository extends IUserReadRepository {
  constructor(database) {
    super();
    this.db = database;
  }

  async findById(id) {
    return tryCatch(async () => {
      const users = await this.db.queryAsync('SELECT * FROM users WHERE id = ?', [id]);
      return users[0] || null;
    })();
  }

  async findByField(field, value) {
    return tryCatch(async () => {
      const users = await this.db.queryAsync(`SELECT * FROM users WHERE ${field} = ?`, [value]);
      return users;
    })();
  }

  async findByUsername(username) {
    return this.findByField('username', username);
  }

  async findByEmail(email) {
    return this.findByField('email', email);
  }

  async userExists(username, email) {
    return tryCatch(async () => {
      const users = await this.db.queryAsync(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      return users.length > 0;
    })();
  }

  async findSessionByToken(token) {
    return tryCatch(async () => {
      const sessions = await this.db.queryAsync(
        'SELECT s.*, u.username, u.email FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime("now")',
        [token]
      );
      return sessions[0] || null;
    })();
  }
}

class UserWriteRepository extends IUserWriteRepository {
  constructor(database) {
    super();
    this.db = database;
  }

  async create(userData) {
    return tryCatch(async () => {
      const exists = await this.db.queryAsync(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [userData.username, userData.email]
      );
      
      if (exists.length > 0) {
        throw new Error('User already exists');
      }

      const { username, email, password } = userData;
      const result = await this.db.queryAsync(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, password]
      );
      return { id: result.lastID, ...userData };
    })();
  }

  async update(id, updateData) {
    return tryCatch(async () => {
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      await this.db.queryAsync(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
      
      const users = await this.db.queryAsync('SELECT * FROM users WHERE id = ?', [id]);
      return users[0];
    })();
  }

  async delete(id) {
    return tryCatch(async () => {
      const result = await this.db.queryAsync('DELETE FROM users WHERE id = ?', [id]);
      return result.changes > 0;
    })();
  }

  async createSession(userId, token, expiresAt) {
    return tryCatch(async () => {
      const result = await this.db.queryAsync(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
      );
      return { id: result.lastID, user_id: userId, token, expires_at: expiresAt };
    })();
  }

  async invalidateSession(token) {
    return tryCatch(async () => {
      const result = await this.db.queryAsync('DELETE FROM sessions WHERE token = ?', [token]);
      return result.changes > 0;
    })();
  }

  async cleanExpiredSessions() {
    return tryCatch(async () => {
      const result = await this.db.queryAsync('DELETE FROM sessions WHERE expires_at <= datetime("now")');
      return result.changes;
    })();
  }
}

class UserRepositoryFactory {
  static create(database) {
    return {
      read: new UserReadRepository(database),
      write: new UserWriteRepository(database)
    };
  }
}

module.exports = {
  UserReadRepository,
  UserWriteRepository,
  UserRepositoryFactory
};