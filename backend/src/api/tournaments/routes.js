// src/api/tournaments/routes.js
const express = require('express');
const router = express.Router();
const tournamentController = require('./controller');
const { param, query } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

// Public routes - no authentication required
router.get('/featured', tournamentController.getFeaturedTournaments);
router.get('/upcoming', tournamentController.getUpcomingTournaments);
router.get('/ongoing', tournamentController.getOngoingTournaments);

router.get(
  '/search',
  [
    query('query')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Search query is required')
      .escape(),
    validateRequest
  ],
  tournamentController.searchTournaments
);

router.get(
  '/:slug',
  [
    param('slug')
      .isString()
      .trim(':')
      .notEmpty()
      .withMessage('Tournament slug is required')
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Invalid tournament slug format')
      .escape(),
    validateRequest
  ],
  tournamentController.getTournamentBySlug
);

router.get(
  '/phase/:phaseId/sets',
  [
    param('phaseId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Phase ID is required')
      .escape(),
    validateRequest
  ],
  tournamentController.getSetsByPhaseId
);

module.exports = router;