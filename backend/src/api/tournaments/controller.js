// src/api/tournaments/controller.js
const tournamentService = require('../../services/tournament');

/**
 * Get featured tournaments
 */
exports.getFeaturedTournaments = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const tournaments = await tournamentService.getFeaturedTournaments(limit);
    
    res.status(200).json({
      status: 'success',
      results: tournaments.length,
      data: {
        tournaments
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upcoming tournaments
 */
exports.getUpcomingTournaments = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const tournaments = await tournamentService.getUpcomingTournaments(limit);
    
    res.status(200).json({
      status: 'success',
      results: tournaments.length,
      data: {
        tournaments
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ongoing tournaments
 */
exports.getOngoingTournaments = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const tournaments = await tournamentService.getOngoingTournaments(limit);
    
    res.status(200).json({
      status: 'success',
      results: tournaments.length,
      data: {
        tournaments
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tournament by slug
 */
exports.getTournamentBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tournament = await tournamentService.getTournamentBySlug(slug);
    
    if (!tournament) {
      return res.status(404).json({
        status: 'fail',
        message: 'Tournament not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        tournament
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sets by phase ID
 */
exports.getSetsByPhaseId = async (req, res, next) => {
  try {
    const { phaseId } = req.params;
    const sets = await tournamentService.getSetsByPhaseId(phaseId);
    
    res.status(200).json({
      status: 'success',
      results: sets.length,
      data: {
        sets
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search tournaments
 */
exports.searchTournaments = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a search query'
      });
    }
    
    // Simple in-memory search through the cache
    const tournaments = await tournamentService.getFeaturedTournaments(100);
    const results = tournaments.filter(tournament => {
      const lowercaseQuery = query.toLowerCase();
      const name = tournament.name.toLowerCase();
      const city = tournament.city ? tournament.city.toLowerCase() : '';
      const state = tournament.addrState ? tournament.addrState.toLowerCase() : '';
      
      return name.includes(lowercaseQuery) || 
             city.includes(lowercaseQuery) || 
             state.includes(lowercaseQuery);
    });
    
    res.status(200).json({
      status: 'success',
      results: results.length,
      data: {
        tournaments: results
      }
    });
  } catch (error) {
    next(error);
  }
};