const { queryAsync } = require('../config/database');
const { curry, pipe } = require('ramda');

const findByField = curry((field, value) => {
  return queryAsync(`SELECT * FROM users WHERE ${field} = ?`, [value]);
});

const findById = findByField('id');
const findByUsername = findByField('username');
const findByEmail = findByField('email');

const createUser = async (userData) => {
  const { username, email, password } = userData;
  const result = await queryAsync(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, password]
  );
  return { id: result.lastID, ...userData };
};

const userExists = async (username, email) => {
  const users = await queryAsync(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [username, email]
  );
  return users.length > 0;
};

const updateUser = curry(async (id, updateData) => {
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  await queryAsync(
    `UPDATE users SET ${setClause} WHERE id = ?`,
    [...values, id]
  );
  
  return findById(id);
});

const deleteUser = async (id) => {
  const result = await queryAsync('DELETE FROM users WHERE id = ?', [id]);
  return result.changes > 0;
};

const createSession = async (userId, token, expiresAt) => {
  const result = await queryAsync(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
  return { id: result.lastID, user_id: userId, token, expires_at: expiresAt };
};

const findSessionByToken = async (token) => {
  const sessions = await queryAsync(
    'SELECT s.*, u.username, u.email FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime("now")',
    [token]
  );
  return sessions[0] || null;
};

const invalidateSession = async (token) => {
  const result = await queryAsync('DELETE FROM sessions WHERE token = ?', [token]);
  return result.changes > 0;
};

const cleanExpiredSessions = async () => {
  const result = await queryAsync('DELETE FROM sessions WHERE expires_at <= datetime("now")');
  return result.changes;
};

const withUserValidation = (operation) => async (userData) => {
  const exists = await userExists(userData.username, userData.email);
  if (exists) {
    throw new Error('User already exists');
  }
  return operation(userData);
};

const withUserFound = (operation) => async (identifier, ...args) => {
  let user;
  if (typeof identifier === 'string' && identifier.includes('@')) {
    const users = await findByEmail(identifier);
    user = users[0];
  } else if (typeof identifier === 'string') {
    const users = await findByUsername(identifier);
    user = users[0];
  } else {
    const users = await findById(identifier);
    user = users[0];
  }
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return operation(user, ...args);
};

module.exports = {
  findById,
  findByUsername,
  findByEmail,
  createUser: withUserValidation(createUser),
  userExists,
  updateUser,
  deleteUser,
  createSession,
  findSessionByToken,
  invalidateSession,
  cleanExpiredSessions,
  withUserFound
};