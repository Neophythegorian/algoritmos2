const { curry, pipe, map, filter, reduce } = require('ramda');
const gameRepository = require('../repositories/gameRepository');
const { 
  generateUNODeck, 
  shuffleDeck, 
  canStartGame, 
  canJoinGame, 
  GAME_STATES 
} = require('../models/Game');

const withGameValidation = (operation) => async (gameData, userId) => {
  const game = await gameRepository.createGame({
    ...gameData,
    creator_id: userId
  });
  return operation(game);
};

const withPlayerValidation = (operation) => async (gameId, userId) => {
  const games = await gameRepository.findGameById(gameId);
  const game = games[0];
  
  if (!game) {
    throw new Error('Game not found');
  }
  
  const players = await gameRepository.getGamePlayers(gameId);
  
  if (!canJoinGame(game, players)) {
    throw new Error('Cannot join game');
  }
  
  const isAlreadyPlayer = players.some(p => p.user_id === userId);
  if (isAlreadyPlayer) {
    throw new Error('User already in game');
  }
  
  return operation(gameId, userId, game, players);
};

const createGameWithDeck = async (gameData, userId) => {
  return withGameValidation(async (game) => {
    const deck = generateUNODeck();
    await gameRepository.createGameCards(game.id, deck);
    
    await gameRepository.addPlayerToGame(game.id, userId);
    
    return game;
  })(gameData, userId);
};

const joinGameSafely = async (gameId, userId) => {
  return withPlayerValidation(async (gameId, userId, game, players) => {
    await gameRepository.addPlayerToGame(gameId, userId);
    return { message: 'User joined the game successfully' };
  })(gameId, userId);
};

const startGameSafely = async (gameId, userId) => {
  return gameRepository.withGameFound(async (game) => {
    if (game.creator_id !== userId) {
      throw new Error('Only game creator can start the game');
    }
    
    if (game.state !== GAME_STATES.WAITING) {
      throw new Error('Game is not in waiting state');
    }
    
    const players = await gameRepository.getGamePlayers(gameId);
    
    if (!canStartGame(players)) {
      throw new Error('Not enough players or not all players are ready');
    }
    
    const deck = await gameRepository.getGameCards(gameId);
    const shuffledDeck = shuffleDeck(deck);
    
    let cardIndex = 0;
    for (const player of players) {
      for (let i = 0; i < 7; i++) {
        await gameRepository.moveCard(
          shuffledDeck[cardIndex].id, 
          'hand', 
          player.user_id, 
          i
        );
        cardIndex++;
      }
    }
    
    await gameRepository.moveCard(
      shuffledDeck[cardIndex].id, 
      'discard', 
      null, 
      0
    );
    
    await gameRepository.updateGame(gameId, {
      state: GAME_STATES.IN_PROGRESS,
      current_player_id: players[0].user_id
    });
    
    return { message: 'Game started successfully' };
  })(gameId);
};

const leaveGameSafely = async (gameId, userId) => {
  return gameRepository.withPlayerInGame(async (gameId, userId) => {
    const game = await gameRepository.findGameById(gameId);
    const currentGame = game[0];
    
    if (currentGame.state === GAME_STATES.IN_PROGRESS) {
      await gameRepository.removePlayerFromGame(gameId, userId);
      
      const remainingPlayers = await gameRepository.getGamePlayers(gameId);
      if (remainingPlayers.length === 0) {
        await gameRepository.updateGame(gameId, { state: GAME_STATES.FINISHED });
      } else if (currentGame.current_player_id === userId) {
        const nextPlayer = remainingPlayers.find(p => p.user_id !== userId);
        if (nextPlayer) {
          await gameRepository.updateGame(gameId, { 
            current_player_id: nextPlayer.user_id 
          });
        }
      }
    } else {
      await gameRepository.removePlayerFromGame(gameId, userId);
    }
    
    return { message: 'User left the game successfully' };
  })(gameId, userId);
};

const endGameSafely = async (gameId, userId) => {
  return gameRepository.withGameFound(async (game) => {
    if (game.creator_id !== userId) {
      throw new Error('Only game creator can end the game');
    }
    
    if (game.state === GAME_STATES.FINISHED) {
      throw new Error('Game is already finished');
    }
    
    await gameRepository.updateGame(gameId, { state: GAME_STATES.FINISHED });
    return { message: 'Game ended successfully' };
  })(gameId);
};

const getGameState = async (gameId) => {
  return gameRepository.withGameFound(async (game) => {
    const players = await gameRepository.getGamePlayers(gameId);
    const topCard = await gameRepository.getTopDiscardCard(gameId);
    
    return {
      game_id: game.id,
      state: game.state,
      name: game.name,
      creator_id: game.creator_id,
      current_player_id: game.current_player_id,
      players_count: players.length,
      top_card: topCard ? {
        type: topCard.card_type,
        value: topCard.card_value,
        color: topCard.card_color
      } : null
    };
  })(gameId);
};

const getPlayersInGame = async (gameId) => {
  return gameRepository.withGameFound(async (game) => {
    const players = await gameRepository.getGamePlayers(gameId);
    return {
      game_id: game.id,
      players: players.map(p => p.username)
    };
  })(gameId);
};

const getCurrentPlayer = async (gameId) => {
  return gameRepository.withGameFound(async (game) => {
    if (!game.current_player_id) {
      return {
        game_id: game.id,
        current_player: null
      };
    }
    
    const players = await gameRepository.getGamePlayers(gameId);
    const currentPlayer = players.find(p => p.user_id === game.current_player_id);
    
    return {
      game_id: game.id,
      current_player: currentPlayer ? currentPlayer.username : null
    };
  })(gameId);
};

const getTopDiscardCard = async (gameId) => {
  return gameRepository.withGameFound(async (game) => {
    const topCard = await gameRepository.getTopDiscardCard(gameId);
    
    return {
      game_id: game.id,
      top_card: topCard ? `${topCard.card_value} of ${topCard.card_color}` : null
    };
  })(gameId);
};

const getPlayerScores = async (gameId) => {
  return gameRepository.withGameFound(async (game) => {
    const scores = await gameRepository.getPlayerScores(gameId);
    const scoresObj = reduce((acc, score) => {
      acc[score.username] = score.score;
      return acc;
    }, {}, scores);
    
    return {
      game_id: game.id,
      scores: scoresObj
    };
  })(gameId);
};

const setPlayerReady = async (gameId, userId, isReady = true) => {
  return gameRepository.withPlayerInGame(async (gameId, userId) => {
    await gameRepository.updatePlayerReady(gameId, userId, isReady);
    return { message: `Player ready status updated to ${isReady}` };
  })(gameId, userId);
};

const composeGameOperations = (...operations) => async (gameId, userId, ...args) => {
  return pipe(...operations)(gameId, userId, ...args);
};

module.exports = {
  createGameWithDeck,
  joinGameSafely,
  startGameSafely,
  leaveGameSafely,
  endGameSafely,
  getGameState,
  getPlayersInGame,
  getCurrentPlayer,
  getTopDiscardCard,
  getPlayerScores,
  setPlayerReady,
  composeGameOperations
};