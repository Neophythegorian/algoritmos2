const express = require('express');
const { pipe } = require('ramda');
const gameController = require('../controllers/gameController');
const { extractTokenFromBody } = require('../services/authService');

const router = express.Router();

const composeRoute = (...middlewares) => middlewares;

router.post('/create', composeRoute(
    extractTokenFromBody,
    gameController.validateGameInput,
    gameController.createGame
));

router.post('/join', composeRoute(
    extractTokenFromBody,
    gameController.joinGame
));

router.post('/start', composeRoute(
    extractTokenFromBody,
    gameController.startGame
));

router.post('/leave', composeRoute(
    extractTokenFromBody,
    gameController.leaveGame
));

router.post('/end', composeRoute(
    extractTokenFromBody,
    gameController.endGame
));

router.post('/ready', composeRoute(
    extractTokenFromBody,
    gameController.setPlayerReady
));

router.post('/state', gameController.getGameState);

router.post('/players', gameController.getGamePlayers);

router.post('/current-player', gameController.getCurrentPlayer);

router.post('/top-card', gameController.getTopCard);

router.post('/scores', gameController.getPlayerScores);

module.exports = router;