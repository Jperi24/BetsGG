// src/api/bets/routes.js
const express = require('express');
const router = express.Router();
const betsController = require('./controller');
const { protect, restrictTo } = require('../../middleware/auth');
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

// Public routes
router.get(
  '/active',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validateRequest
  ],
  betsController.getActiveBets
);

router.get(
  '/:betId',
  [
    param('betId').isMongoId().withMessage('Invalid bet ID'),
    validateRequest
  ],
  betsController.getBetById
);



// Fix the route to use a parameter for tournament slug
router.get(
  '/tournament/:tournamentSlug',
  [
    param('tournamentSlug')
      .isString()
      .trim()
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Invalid tournament slug format'),
    query('status').optional().isIn(['open', 'in_progress', 'completed', 'cancelled', 'disputed']),
    validateRequest
  ],
  betsController.getBetsByTournament
);

// Protected routes (require authentication)
router.use(protect);



router.post(
  '/',
  [
    body('tournamentSlug')
      .isString()
      .trim()
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Invalid tournament slug format'),
    body('eventId').isString().trim(),
    body('eventName').isString().trim(),
    body('phaseId').isString().trim(),
    body('phaseName').isString().trim(),
    body('setId').isString().trim(),
    body('minimumBet')
      .isFloat({ min: 0.0001 })
      .withMessage('Minimum bet must be at least 0.0001'),
    body('maximumBet')
      .isFloat({ min: 0.001 })
      .withMessage('Maximum bet must be at least 0.001'),
    validateRequest
  ],
  betsController.createBet
);

router.post(
  '/:betId/place',
  [
    param('betId').isMongoId().withMessage('Invalid bet ID'),
    body('prediction')
      .isInt({ min: 1, max: 2 })
      .withMessage('Prediction must be 1 (contestant 1) or 2 (contestant 2)'),
    body('amount')
      .isFloat({ min: 0.0001 })
      .withMessage('Amount must be at least 0.0001'),
    validateRequest
  ],
  betsController.placeBet
);

router.post(
  '/:betId/claim',
  [
    param('betId').isMongoId().withMessage('Invalid bet ID'),
    validateRequest
  ],
  betsController.claimWinnings
);

router.post(
  '/:betId/dispute',
  [
    param('betId').isMongoId().withMessage('Invalid bet ID'),
    body('reason')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Please provide a reason for the dispute'),
    validateRequest
  ],
  betsController.reportDispute
);

// User-specific routes
router.get('/user/created', betsController.getUserCreatedBets);
router.get('/user/participated', betsController.getUserParticipatedBets);

// Admin-only routes
router.use(restrictTo('admin'));

router.post(
  '/:betId/cancel',
  [
    param('betId').isMongoId().withMessage('Invalid bet ID'),
    body('reason')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Please provide a reason for cancellation'),
    validateRequest
  ],
  betsController.cancelBet
);

router.put(
  '/:betId/status',
  [
    param('betId').isMongoId().withMessage('Invalid bet ID'),
    body('status')
      .isIn(['open', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('winner')
      .optional()
      .isInt({ min: 0, max: 2 })
      .withMessage('Winner must be 0 (draw/cancelled), 1 (contestant 1), or 2 (contestant 2)'),
    validateRequest
  ],
  betsController.updateBetStatus
);

module.exports = router;