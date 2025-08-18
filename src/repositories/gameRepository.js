const { queryAsync, withTransaction } = require('../config/database');
const { curry, pipe } = require('ramda');

const findByField = curry((table, field, value) => {
  return queryAsync(`SELECT * FROM ${table} WHERE ${field} = ?`, [value]);
});

const findGameById = curry((id) => findByField('games', 'id', id));
const findGamesByCreator = curry((creatorId) => findByField('games', 'creator_id', creatorId));

const createGame = async (gameData) => {
  const { name, rules, creator_id } = gameData;
  const result = await queryAsync(
    'INSERT INTO games (name, rules, creator_id, state) VALUES (?, ?, ?, ?)',
    [name, rules, creator_id, 'waiting']
  );
  return { id: result.lastID, ...gameData, state: 'waiting' };
};

const updateGame = curry(async (id, updateData) => {
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  await queryAsync(
    `UPDATE games SET ${setClause} WHERE id = ?`,
    [...values, id]
  );
  
  const games = await findGameById(id);
  return games[0];
});

const deleteGame = async (id) => {
  const result = await queryAsync('DELETE FROM games WHERE id = ?', [id]);
  return result.changes > 0;
};

const addPlayerToGame = async (gameId, userId) => {
  const result = await queryAsync(
    'INSERT INTO game_players (game_id, user_id) VALUES (?, ?)',
    [gameId, userId]
  );
  return { id: result.lastID, game_id: gameId, user_id: userId, score: 0, is_ready: false };
};

const removePlayerFromGame = async (gameId, userId) => {
  const result = await queryAsync(
    'DELETE FROM game_players WHERE game_id = ? AND user_id = ?',
    [gameId, userId]
  );
  return result.changes > 0;
};

const getGamePlayers = async (gameId) => {
  return queryAsync(`
    SELECT gp.*, u.username 
    FROM game_players gp 
    JOIN users u ON gp.user_id = u.id 
    WHERE gp.game_id = ?
    ORDER BY gp.joined_at
  `, [gameId]);
};

const updatePlayerReady = async (gameId, userId, isReady) => {
  await queryAsync(
    'UPDATE game_players SET is_ready = ? WHERE game_id = ? AND user_id = ?',
    [isReady, gameId, userId]
  );
};

const isPlayerInGame = async (gameId, userId) => {
  const players = await queryAsync(
    'SELECT id FROM game_players WHERE game_id = ? AND user_id = ?',
    [gameId, userId]
  );
  return players.length > 0;
};

const getPlayerScores = async (gameId) => {
  return queryAsync(`
    SELECT u.username, gp.score 
    FROM game_players gp 
    JOIN users u ON gp.user_id = u.id 
    WHERE gp.game_id = ?
  `, [gameId]);
};

const createGameCards = async (gameId, cards) => {
  return withTransaction(async () => {
    const promises = cards.map((card, index) => 
      queryAsync(
        'INSERT INTO cards (game_id, card_type, card_value, card_color, position, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [gameId, card.card_type, card.card_value, card.card_color, card.position, index]
      )
    );
    await Promise.all(promises);
    return cards.length;
  });
};

const getGameCards = async (gameId) => {
  return queryAsync(
    'SELECT * FROM cards WHERE game_id = ? ORDER BY order_index',
    [gameId]
  );
};

const getTopDiscardCard = async (gameId) => {
  const cards = await queryAsync(
    'SELECT * FROM cards WHERE game_id = ? AND position = "discard" ORDER BY order_index DESC LIMIT 1',
    [gameId]
  );
  return cards[0] || null;
};

const getPlayerCards = async (gameId, playerId) => {
  return queryAsync(
    'SELECT * FROM cards WHERE game_id = ? AND player_id = ? ORDER BY order_index',
    [gameId, playerId]
  );
};

const moveCard = async (cardId, newPosition, playerId = null, newOrderIndex = 0) => {
  await queryAsync(
    'UPDATE cards SET position = ?, player_id = ?, order_index = ? WHERE id = ?',
    [newPosition, playerId, newOrderIndex, cardId]
  );
};

const withGameFound = (operation) => async (gameId, ...args) => {
  const games = await findGameById(gameId);
  const game = games[0];
  
  if (!game) {
    throw new Error('Game not found');
  }
  
  return operation(game, ...args);
};

const withPlayerInGame = (operation) => async (gameId, userId, ...args) => {
  const inGame = await isPlayerInGame(gameId, userId);
  if (!inGame) {
    throw new Error('Player not in game');
  }
  
  return operation(gameId, userId, ...args);
};

const withGameState = curry((expectedState, operation) => async (game, ...args) => {
  if (game.state !== expectedState) {
    throw new Error(`Game must be in ${expectedState} state`);
  }
  
  return operation(game, ...args);
});

const startGameWithCards = async (gameId, cards) => {
  return withTransaction(async () => {
    await updateGame(gameId, { state: 'in_progress' });
    
    await createGameCards(gameId, cards);
    
    const players = await getGamePlayers(gameId);
    if (players.length > 0) {
      await updateGame(gameId, { current_player_id: players[0].user_id });
    }
    
    return findGameById(gameId);
  });
};

module.exports = {
  findGameById,
  findGamesByCreator,
  createGame,
  updateGame,
  deleteGame,
  addPlayerToGame,
  removePlayerFromGame,
  getGamePlayers,
  updatePlayerReady,
  isPlayerInGame,
  getPlayerScores,
  createGameCards,
  getGameCards,
  getTopDiscardCard,
  getPlayerCards,
  moveCard,
  startGameWithCards,
  withGameFound,
  withPlayerInGame,
  withGameState
};