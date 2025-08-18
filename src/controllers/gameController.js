const { curry, pipe } = require('ramda');
const gameService = require('../services/gameService');
const authService = require('../services/authService');
const { 
  prepareGameForCreation, 
  prepareGameForResponse, 
  validateGameCreation 
} = require('../models/Game');

const { 
  asyncHandler, 
  sendSuccess, 
  sendCreated, 
  sendBadRequest, 
  sendUnauthorized, 
  sendNotFound, 
  sendConflict, 
  sendServerError 
} = require('./userController');

const withAuthentication = (operation) => asyncHandler(async (req, res) => {
  try {
    const token = req.body.access_token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return sendBadRequest(res, 'Access token required');
    }
    
    const { user } = await authService.validateAccessToken(token);
    req.user = user;
    
    const result = await operation(req, res);
    return result;
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      return sendUnauthorized(res, 'Invalid or expired token');
    }
    throw error;
  }
});

const validateGameInput = (req, res, next) => {
  const validation = validateGameCreation(req.body);
  if (!validation.isValid) {
    return sendBadRequest(res, validation.errors.join(', '));
  }
  next();
};

const createGame = withAuthentication(async (req, res) => {
  try {
    const gameData = prepareGameForCreation(req.body);
    const game = await gameService.createGameWithDeck(gameData, req.user.id);
    const responseData = prepareGameForResponse(game);
    
    sendCreated(res, {
      message: 'Game created successfully',
      game_id: game.id,
      game: responseData
    });
  } catch (error) {
    sendServerError(res, 'Failed to create game');
  }
});

const joinGame = withAuthentication(async (req, res) => {
  try {
    const { game_id } = req.body;
    
    if (!game_id) {
      return sendBadRequest(res, 'Game ID is required');
    }
    
    const result = await gameService.joinGameSafely(game_id, req.user.id);
    sendSuccess(res, result);
  } catch (error) {
    switch (error.message) {
      case 'Game not found':
        return sendNotFound(res, 'Game not found');
      case 'Cannot join game':
        return sendBadRequest(res, 'Cannot join game - may be full or already started');
      case 'User already in game':
        return sendConflict(res, 'User already in game');
      default:
        return sendServerError(res, 'Failed to join game');
    }
  }
});

const startGame = withAuthentication(async (req, res) => {
  try {
    const { game_id } = req.body;
    
    if (!game_id) {
      return sendBadRequest(res, 'Game ID is required');
    }
    
    const result = await gameService.startGameSafely(game_id, req.user.id);
    sendSuccess(res, result);
  } catch (error) {
    switch (error.message) {
      case 'Game not found':
        return sendNotFound(res, 'Game not found');
      case 'Only game creator can start the game':
        return sendUnauthorized(res, 'Only game creator can start the game');
      case 'Game is not in waiting state':
        return sendBadRequest(res, 'Game is not in waiting state');
      case 'Not enough players or not all players are ready':
        return sendBadRequest(res, 'Not enough players or not all players are ready');
      default:
        return sendServerError(res, 'Failed to start game');
    }
  }
});

const leaveGame = withAuthentication(async (req, res) => {
  try {
    const { game_id } = req.body;
    
    if (!game_id) {
      return sendBadRequest(res, 'Game ID is required');
    }
    
    const result = await gameService.leaveGameSafely(game_id, req.user.id);
    sendSuccess(res, result);
  } catch (error) {
    switch (error.message) {
      case 'Game not found':
        return sendNotFound(res, 'Game not found');
      case 'Player not in game':
        return sendBadRequest(res, 'Player not in game');
      default:
        return sendServerError(res, 'Failed to leave game');
    }
  }
});

const endGame = withAuthentication(async (req, res) => {
  try {
    const { game_id } = req.body;
    
    if (!game_id) {
      return sendBadRequest(res, 'Game ID is required');
    }
    
    const result = await gameService.endGameSafely(game_id, req.user.id);
    sendSuccess(res, result);
  } catch (error) {
    switch (error.message) {
      case 'Game not found':
        return sendNotFound(res, 'Game not found');
      case 'Only game creator can end the game':
        return sendUnauthorized(res, 'Only game creator can end the game');
      case 'Game is already finished':
        return sendBadRequest(res, 'Game is already finished');
      default:
        return sendServerError(res, 'Failed to end game');
    }
  }
});

const getGameState = asyncHandler(async (req, res) => {
  try {
    const { game_id } = req.body;
    
    if (!game_id) {
      return sendBadRequest(res, 'Game ID is required');
    }
    
    const gameState = await gameService.getGameState(game_id);
    sendSuccess(res, gameState);
  } catch (error) {
    if (error.message === 'Game not found') {
      return sendNotFound(res, 'Game not found');
    }
    sendServerError(res, 'Failed to get game state');
  }
});

const getGamePlayers = asyncHandler(async (req, res) => {
  try {
    const { game_id } = req.body;
    
    if (!game_id) {
      return sendBadRequest(res, 'Game ID is required');
    }
    
    const players = await gameService.getPlayersInGame(game_id);
    sendSuccess(res, players);
  } catch (error) {
    if (error.message === 'Game not found') {
      return sendNotFound(res, 'Game not found');
    }
    sendServerError(res, 'Failed to get game players');
  }
});

const getCurrentPlayer = asyncHandler(async (req, res) => {
  try {
    const { game_id } = req.body;
    
    if (!game_id) {
      return sendBadRequest(res, 'Game ID is required');
    }
    
    const currentPlayer = await gameService.getCurrentPlayer(game_id);
    sendSuccess(res, currentPlayer);
  } catch (error) {
    if (error.message === 'Game not found') {
      return sendNotFound(res, 'Game not found');
    }
    sendServerError(res, 'Failed to get current player');
  }
});

const getTopCard = asyncHandler(async (req, res) => {
  try {
    const { game_id } = req.body;
    
    if (!game_id) {
      return sendBadRequest(res, 'Game ID is required');
    }
    
    const topCard = await gameService.getTopDiscardCard(game_id);
    sendSuccess(res, topCard);
  } catch (error) {
    if (error.message === 'Game not found') {
      return sendNotFound(res, 'Game not found');
    }
    sendServerError(res, 'Failed to get top card');
  }
});

const getPlayerScores = asyncHandler(async (req, res) => {
  try {
    const { game_id } = req.body;
    
    if (!game_id) {
      return sendBadRequest(res, 'Game ID is required');
    }
    
    const scores = await gameService.getPlayerScores(game_id);
    sendSuccess(res, scores);
  } catch (error) {
    if (error.message === 'Game not found') {
      return sendNotFound(res, 'Game not found');
    }
    sendServerError(res, 'Failed to get player scores');
  }
});

const setPlayerReady = withAuthentication(async (req, res) => {
  try {
    const { game_id, is_ready = true } = req.body;
    
    if (!game_id) {
      return sendBadRequest(res, 'Game ID is required');
    }
    
    const result = await gameService.setPlayerReady(game_id, req.user.id, is_ready);
    sendSuccess(res, result);
  } catch (error) {
    switch (error.message) {
      case 'Game not found':
        return sendNotFound(res, 'Game not found');
      case 'Player not in game':
        return sendBadRequest(res, 'Player not in game');
      default:
        return sendServerError(res, 'Failed to update ready status');
    }
  }
});

module.exports = {
  createGame,
  joinGame,
  startGame,
  leaveGame,
  endGame,
  getGameState,
  getGamePlayers,
  getCurrentPlayer,
  getTopCard,
  getPlayerScores,
  setPlayerReady,
  validateGameInput
};