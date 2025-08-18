const { pipe, pick, omit, map, filter, curry } = require('ramda');

const GAME_STATES = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished'
};

const CARD_TYPES = {
  NUMBER: 'number',
  SKIP: 'skip',
  REVERSE: 'reverse',
  DRAW_TWO: 'draw_two',
  WILD: 'wild',
  WILD_DRAW_FOUR: 'wild_draw_four'
};

const CARD_COLORS = ['red', 'blue', 'green', 'yellow'];
const CARD_NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const sanitizeGameData = omit(['password']);
const validateGameInput = pick(['name', 'rules']);

const prepareGameForCreation = pipe(
  validateGameInput,
  game => ({
    ...game,
    name: game.name?.trim(),
    state: GAME_STATES.WAITING
  })
);

const prepareGameForResponse = pick(['id', 'name', 'rules', 'state', 'creator_id', 'current_player_id', 'created_at']);

const createCard = curry((type, value, color) => ({
  card_type: type,
  card_value: value,
  card_color: color,
  position: 'deck'
}));

const createNumberCard = createCard(CARD_TYPES.NUMBER);
const createSpecialCard = curry((type, color) => createCard(type, type, color));
const createWildCard = curry((type) => createCard(type, type, null));

const generateUNODeck = () => {
  const cards = [];
  
  CARD_COLORS.forEach(color => {
    cards.push(createNumberCard('0', color));
    
    CARD_NUMBERS.slice(1).forEach(number => {
      cards.push(createNumberCard(number, color));
      cards.push(createNumberCard(number, color));
    });
    
    [CARD_TYPES.SKIP, CARD_TYPES.REVERSE, CARD_TYPES.DRAW_TWO].forEach(type => {
      cards.push(createSpecialCard(type, color));
      cards.push(createSpecialCard(type, color));
    });
  });
  
  for (let i = 0; i < 4; i++) {
    cards.push(createWildCard(CARD_TYPES.WILD));
    cards.push(createWildCard(CARD_TYPES.WILD_DRAW_FOUR));
  }
  
  return cards;
};

const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const createPlayer = curry((gameId, userId, isReady = false) => ({
  game_id: gameId,
  user_id: userId,
  score: 0,
  is_ready: isReady
}));

const isValidGameName = (name) => {
  return name && name.trim().length >= 3 && name.trim().length <= 50;
};

const canStartGame = (players) => {
  return players.length >= 2 && players.length <= 4 && players.every(p => p.is_ready);
};

const canJoinGame = (game, players, maxPlayers = 4) => {
  return game.state === GAME_STATES.WAITING && players.length < maxPlayers;
};

const validateGame = (validationRules) => (gameData) => {
  const errors = [];
  
  validationRules.forEach(rule => {
    const result = rule(gameData);
    if (result !== true) {
      errors.push(result);
    }
  });
  
  return errors.length === 0 ? { isValid: true } : { isValid: false, errors };
};

const gameCreationRules = [
  (game) => isValidGameName(game.name) || 'Game name must be between 3-50 characters'
];

const validateGameCreation = validateGame(gameCreationRules);

const updateGameState = curry((newState, game) => ({
  ...game,
  state: newState
}));

const setCurrentPlayer = curry((playerId, game) => ({
  ...game,
  current_player_id: playerId
}));

const startGame = pipe(
  updateGameState(GAME_STATES.IN_PROGRESS),
  game => ({
    ...game,
    deck: shuffleDeck(generateUNODeck())
  })
);

module.exports = {
  GAME_STATES,
  CARD_TYPES,
  CARD_COLORS,
  prepareGameForCreation,
  prepareGameForResponse,
  validateGameCreation,
  generateUNODeck,
  shuffleDeck,
  createPlayer,
  canStartGame,
  canJoinGame,
  startGame,
  updateGameState,
  setCurrentPlayer
};