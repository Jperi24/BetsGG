// src/services/notification/tournament-notifications.js
const User = require('../../models/User');
const Bet = require('../../models/Bet');
const NotificationPreferences = require('../../models/NotificationPreferences');
const notificationService = require('./index');

/**
 * Send notifications for tournaments starting soon
 * @param {Object} tournament - Tournament data
 * @param {number} hoursAhead - Hours before tournament to send notification
 */
const notifyUpcomingTournament = async (tournament, hoursAhead = 24) => {
  try {
    // Calculate current time and tournament start time
    const currentTime = Math.floor(Date.now() / 1000);
    const tournamentStartTime = tournament.startAt;
    
    // Calculate hours until tournament starts
    const hoursUntilStart = Math.floor((tournamentStartTime - currentTime) / 3600);
    
    // Only send if tournament is starting in approximately hoursAhead hours
    if (hoursUntilStart < hoursAhead - 1 || hoursUntilStart > hoursAhead + 1) {
      return {
        sent: false,
        reason: 'Tournament is not starting within the target time window'
      };
    }
    
    // Find all users who have enabled tournament notifications
    const usersWithPrefs = await NotificationPreferences.find({
      'email.tournamentReminders': true
    }).select('user');
    
    const userIds = usersWithPrefs.map(pref => pref.user);
    
    // Find all users who have placed bets on this tournament
    const betsForTournament = await Bet.find({
      tournamentId: tournament.id
    }).select('participants.user creator');
    
    const betParticipantIds = new Set();
    betsForTournament.forEach(bet => {
      // Add creator
      if (bet.creator) {
        betParticipantIds.add(bet.creator.toString());
      }
      
      // Add participants
      bet.participants.forEach(participant => {
        betParticipantIds.add(participant.user.toString());
      });
    });
    
    // Combine unique user IDs
    const uniqueUserIds = [...new Set([...userIds, ...betParticipantIds])];
    
    // Send notifications
    let sentCount = 0;
    for (const userId of uniqueUserIds) {
      await notificationService.notifyTournamentStarting(userId, tournament);
      sentCount++;
    }
    
    return {
      sent: true,
      count: sentCount
    };
  } catch (error) {
    console.error('Error sending tournament notifications:', error);
    return {
      sent: false,
      error: error.message
    };
  }
};

/**
 * Send notifications for matches starting soon
 * @param {number} minutesAhead - Minutes before match to send notification
 */
const notifyUpcomingMatches = async (minutesAhead = 30) => {
  try {
    // Get current time
    const currentTime = new Date();
    
    // Calculate target start time range (e.g., matches starting in 25-35 minutes)
    const lowerBound = new Date(currentTime.getTime() + (minutesAhead - 5) * 60000);
    const upperBound = new Date(currentTime.getTime() + (minutesAhead + 5) * 60000);
    
    // Find bets with matches starting soon
    const upcomingBets = await Bet.find({
      startTime: { $gte: lowerBound, $lte: upperBound },
      status: { $in: ['open', 'in_progress'] }
    });
    
    console.log(`Found ${upcomingBets.length} matches starting in ~${minutesAhead} minutes`);
    
    let notificationCount = 0;
    
    // Send notifications to all participants
    for (const bet of upcomingBets) {
      // Notify the creator
      if (bet.creator) {
        await notificationService.notifyMatchStarting(bet.creator, bet);
        notificationCount++;
      }
      
      // Notify all participants
      for (const participant of bet.participants) {
        await notificationService.notifyMatchStarting(participant.user, bet);
        notificationCount++;
      }
    }
    
    return {
      sent: notificationCount > 0,
      count: notificationCount
    };
  } catch (error) {
    console.error('Error sending match notifications:', error);
    return {
      sent: false,
      error: error.message
    };
  }
};

/**
 * Schedule regular tournament and match notifications
 */
const scheduleNotifications = () => {
  const ONE_HOUR = 60 * 60 * 1000;
  const TEN_MINUTES = 10 * 60 * 1000;
  
  // Check for tournaments starting in ~24 hours every hour
  setInterval(async () => {
    try {
      console.log('Checking for tournaments starting soon...');
      
      // Get tournaments starting in ~24 hours
      const currentTime = Math.floor(Date.now() / 1000);
      const targetTime = currentTime + 24 * 3600; // 24 hours ahead
      
      // This would normally come from your tournamentService
      const upcomingTournaments = await getTournamentsStartingAround(targetTime);
      
      for (const tournament of upcomingTournaments) {
        await notifyUpcomingTournament(tournament, 24);
      }
    } catch (error) {
      console.error('Error in tournament notification scheduler:', error);
    }
  }, ONE_HOUR);
  
  // Check for matches starting in ~30 minutes every 10 minutes
  setInterval(async () => {
    try {
      await notifyUpcomingMatches(30);
    } catch (error) {
      console.error('Error in match notification scheduler:', error);
    }
  }, TEN_MINUTES);
  
  console.log('Tournament and match notification schedulers initialized');
};

/**
 * Helper function to get tournaments starting around a specific time
 * @param {number} targetTime - Unix timestamp to check around
 * @param {number} rangeHours - Hours range to check
 */
const getTournamentsStartingAround = async (targetTime, rangeHours = 1) => {
  // This would normally use your tournamentService
  const Tournament = require('../../models/Tournament');
  
  const lowerBound = targetTime - rangeHours * 3600;
  const upperBound = targetTime + rangeHours * 3600;
  
  const tournaments = await Tournament.find({
    startAt: { $gte: lowerBound, $lte: upperBound }
  });
  
  return tournaments;
};

module.exports = {
  notifyUpcomingTournament,
  notifyUpcomingMatches,
  scheduleNotifications
};