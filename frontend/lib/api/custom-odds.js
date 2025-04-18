// lib/api/custom-odds.js
import apiClient, { handleApiResponse } from './index';

/**
 * Create a new bet offer with custom odds
 * @param {Object} data - Offer data with betId, prediction, amount, odds
 * @returns {Promise} - API response
 */
export const createBetOffer = async (data) => {
  try {
    const response = await apiClient.post('/custom-bets/offer', data);
    return handleApiResponse(response);
  } catch (error) {
    console.error('Error creating bet offer:', error);
    throw error;
  }
};

/**
 * Accept an existing bet offer
 * @param {Object} data - Accept data with betId, offerId, acceptAmount
 * @returns {Promise} - API response
 */
export const acceptBetOffer = async (data) => {
  try {
    const response = await apiClient.post('/custom-bets/offer/accept', data);
    return handleApiResponse(response);
  } catch (error) {
    console.error('Error accepting bet offer:', error);
    throw error;
  }
};

/**
 * Get all active bet offers for a specific bet
 * @param {string} betId - ID of the bet
 * @returns {Promise} - API response with offers
 */
export const getBetOffers = async (betId) => {
  try {
    const response = await apiClient.get(`/custom-bets/${betId}/offers`);
    return handleApiResponse(response);
  } catch (error) {
    console.error('Error getting bet offers:', error);
    throw error;
  }
};

/**
 * Get a specific bet with detailed offer information
 * @param {string} betId - ID of the bet
 * @returns {Promise} - API response with bet details and offers
 */
export const getBetWithOffers = async (betId) => {
  try {
    const response = await apiClient.get(`/custom-bets/${betId}/details`);
    return handleApiResponse(response);
  } catch (error) {
    console.error('Error getting bet details:', error);
    throw error;
  }
};

/**
 * Get user's bets on a specific match
 * @param {string} betId - ID of the bet
 * @returns {Promise} - API response with user's bets
 */
export const getUserBets = async (betId) => {
  try {
    const response = await apiClient.get(`/custom-bets/${betId}/user-bets`);
    return handleApiResponse(response);
  } catch (error) {
    console.error('Error getting user bets:', error);
    throw error;
  }
};

/**
 * Cancel a bet offer
 * @param {string} betId - ID of the bet
 * @param {string} offerId - ID of the offer to cancel
 * @returns {Promise} - API response
 */
export const cancelBetOffer = async (betId, offerId) => {
  try {
    const response = await apiClient.delete(`/custom-bets/${betId}/offer/${offerId}`);
    return handleApiResponse(response);
  } catch (error) {
    console.error('Error cancelling bet offer:', error);
    throw error;
  }
};

/**
 * Claim winnings for a completed bet
 * @param {string} betId - ID of the bet
 * @returns {Promise} - API response with claimed winnings details
 */
export const claimCustomBetWinnings = async (betId) => {
  try {
    const response = await apiClient.post(`/custom-bets/${betId}/claim`);
    return handleApiResponse(response);
  } catch (error) {
    console.error('Error claiming winnings:', error);
    throw error;
  }
};