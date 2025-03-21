// src/server.js
const { app, connectDB } = require('./app');
const seedDatabase = require('./utils/seed-data');
const tournamentService = require('./services/tournament');
const cleanupExpiredTournaments = require('./services/tournament/cleanup')
const betUpdateService = require('./services/betting/update-service');
const { client: redisClient } = require('./utils/redis');

// Flag to determine if we should seed the database
const shouldSeedDatabase = process.env.SEED_DATABASE === 'true';

// Connect to database and start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();

    await new Promise((resolve, reject) => {
      if (redisClient.connected) {
        resolve();
        return;
      }
      
      redisClient.once('connect', resolve);
      redisClient.once('error', (err) => {
        console.error('Redis connection error during startup:', err);
        // Continue anyway - we'll have fallbacks
        resolve();
      });
      setTimeout(resolve, 5000);
    });
    
    // Seed database if needed
    if (shouldSeedDatabase) {
      console.log('Seeding database...');
      await seedDatabase();
      console.log('Database seeded successfully!');
    }

    await cleanupExpiredTournaments.cleanupExpiredTournaments();
    
    // Initialize tournament cache

  
    await tournamentService.initializeCache();
 


    
    // Setup scheduled updates for tournament data
    tournamentService.setupScheduledUpdates();
    
    // Setup scheduled updates for bet statuses
    betUpdateService.setupScheduledUpdates(10); // Check every 10 minutes

 
    
    // Start server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();