// src/api/bets/custom-odds-routes.js
const express = require('express');
const router = express.Router();
const customOddsController = require('./custom-odds-controller');
const { protect } = require('../../middleware/auth');
const { body, param } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

// Public routes
router.get(
  '/:betId/offers',
  [
    param('betId').isMongoId().withMessage('Invalid bet ID'),
    validateRequest
  ],
  customOddsController.getBetOffers
);

router.get(
  '/:betId/details',
  [
    param('betId').isMongoId().withMessage('Invalid bet ID'),
    validateRequest
  ],
  customOddsController.getBetWithOffers
);

// Protected routes (require authentication)
router.use(protect);

// Create a new bet offer
router.post(
  '/offer',
  [
    body('betId').isMongoId().withMessage('Invalid bet ID'),
    body('prediction')
      .isInt({ min: 1, max: 2 })
      .withMessage('Prediction must be 1 (contestant 1) or 2 (contestant 2)'),
    body('amount')
      .isFloat({ min: 0.0001 })
      .withMessage('Amount must be at least 0.0001'),
    body('odds.numerator')
      .isInt({ min: 1 })
      .withMessage('Odds numerator must be a positive integer'),
    body('odds.denominator')
      .isInt({ min: 1 })
      .withMessage('Odds denominator must be a positive integer'),
    validateRequest
  ],
  customOddsController.createBetOffer
);

// Accept a bet offer
router.post(
  '/offer/accept',
  [
    body('betId').isMongoId().withMessage('Invalid bet ID'),
    body('offerId').isMongoId().withMessage('Invalid offer ID'),
    body('acceptAmount')
      .isFloat({ min: 0.0001 })
      .withMessage('Accept amount must be at least 0.0001'),
    validateRequest
  ],
  customOddsController.acceptBetOffer
);

// Claim winnings
router.post(
  '/:betId/claim',
  [
    param('betId').isMongoId().withMessage('Invalid bet ID'),
    validateRequest
  ],
  customOddsController.claimBetWinnings
);

// Cancel a bet offer
router.delete(
  '/:betId/offer/:offerId',
  [
    param('betId').isMongoId().withMessage('Invalid bet ID'),
    param('offerId').isMongoId().withMessage('Invalid offer ID'),
    validateRequest
  ],
  customOddsController.cancelBetOffer
);

// Get user's bets on a specific match
router.get(
  '/:betId/user-bets',
  [
    param('betId').isMongoId().withMessage('Invalid bet ID'),
    validateRequest
  ],
  customOddsController.getUserBets
);

module.exports = router;