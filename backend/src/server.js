// src/server.js
const { app, connectDB } = require('./app');
const seedDatabase = require('./utils/seed-data');
const tournamentService = require('./services/tournament');

// Flag to determine if we should seed the database
const shouldSeedDatabase = process.env.SEED_DATABASE === 'true';

// Connect to database and start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    
    // Seed database if needed
    if (shouldSeedDatabase) {
      console.log('Seeding database...');
      await seedDatabase();
      console.log('Database seeded successfully!');
    }
    
    // Initialize tournament cache
    await tournamentService.initializeCache();
    
    // Setup scheduled updates for tournament data
    tournamentService.setupScheduledUpdates();
    
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