// src/utils/seed-data.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Bet = require('../models/Bet');
const Transaction = require('../models/Transactions');
const { startGGApi } = require('../integrations/startgg/client');
require('dotenv').config();

/**
 * Seed database with initial data
 */
const seedDatabase = async () => {
  console.log('Starting database seeding...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');
    
    // Check if we already have data
    const usersCount = await User.countDocuments();
    if (usersCount > 0) {
      console.log('Database already seeded, skipping...');
      await mongoose.disconnect();
      return;
    }
    
    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    const admin = new User({
      email: 'admin@esportsbets.com',
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      balance: 10.0
    });
    
    await admin.save();
    console.log('Admin user created...');
    
    // Create test users
    const testUsers = [];
    for (let i = 1; i <= 3; i++) {
      const user = new User({
        email: `user${i}@example.com`,
        username: `user${i}`,
        password: 'password123',
        balance: 1.0
      });
      
      testUsers.push(await user.save());
    }
    console.log('Test users created...');
    
    // Fetch some real tournaments from Start.GG
    console.log('Fetching tournaments from Start.GG...');
    const afterDate = Math.floor(new Date().setDate(new Date().getDate() - 30) / 1000); // 30 days ago
    const beforeDate = Math.floor(new Date().setDate(new Date().getDate() + 30) / 1000); // 30 days ahead
    
    try {
      const { tournaments } = await startGGApi.getTournaments(afterDate, beforeDate, 1, 10);
      
      // Save tournaments to database
      for (const tournamentData of tournaments) {
        try {
          // Get detailed tournament info
          const tournamentDetail = await startGGApi.getTournamentDetails(tournamentData.slug);
          
          // Create tournament document
          const tournament = new Tournament(tournamentDetail);
          await tournament.save();
          console.log(`Tournament saved: ${tournament.name}`);
          
          // Add deposit transactions for test users
          for (let i = 0; i < testUsers.length; i++) {
            await Transaction.create({
              user: testUsers[i]._id,
              type: 'deposit',
              amount: 1.0,
              currency: 'ETH',
              status: 'completed',
              walletAddress: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
              network: 'ethereum',
              description: 'Initial deposit'
            });
          }
          
          // If tournament has events and phases, create a sample bet
          if (tournament.events && tournament.events.length > 0) {
            const event = tournament.events[0];
            
            if (event.phases && event.phases.length > 0) {
              const phase = event.phases[0];
              
              // Get sets for this phase
              try {
                const sets = await startGGApi.getSetsByPhase(phase.id, 1, 10);
                
                // Find a valid set with two entrants
                const validSet = sets.find(set => 
                  set.slots && 
                  set.slots.length === 2 && 
                  set.slots[0].entrant && 
                  set.slots[1].entrant
                );
                
                if (validSet) {
                  // Create a sample bet
                  const bet = new Bet({
                    tournamentId: tournament.id,
                    tournamentSlug: tournament.slug,
                    tournamentName: tournament.name,
                    eventId: event.id,
                    eventName: event.name,
                    phaseId: phase.id,
                    phaseName: phase.name,
                    setId: validSet.id,
                    matchName: validSet.fullRoundText || `${validSet.slots[0].entrant.name} vs ${validSet.slots[1].entrant.name}`,
                    contestant1: {
                      id: validSet.slots[0].entrant.id,
                      name: validSet.slots[0].entrant.name
                    },
                    contestant2: {
                      id: validSet.slots[1].entrant.id,
                      name: validSet.slots[1].entrant.name
                    },
                    creator: admin._id,
                    minimumBet: 0.001,
                    maximumBet: 0.5,
                    status: 'open',
                    totalPool: 0.2,
                    contestant1Pool: 0.12,
                    contestant2Pool: 0.08,
                    participants: [
                      {
                        user: testUsers[0]._id,
                        prediction: 1,
                        amount: 0.12,
                        claimed: false,
                        timestamp: new Date()
                      },
                      {
                        user: testUsers[1]._id,
                        prediction: 2,
                        amount: 0.08,
                        claimed: false,
                        timestamp: new Date()
                      }
                    ]
                  });
                  
                  await bet.save();
                  console.log(`Sample bet created for: ${tournament.name}`);
                  
                  // Update the users' participating bets
                  await User.findByIdAndUpdate(
                    testUsers[0]._id,
                    { $push: { participatedBets: bet._id } }
                  );
                  
                  await User.findByIdAndUpdate(
                    testUsers[1]._id,
                    { $push: { participatedBets: bet._id } }
                  );
                  
                  // Create sample transactions for the bets
                  await Transaction.create({
                    user: testUsers[0]._id,
                    type: 'bet',
                    amount: 0.12,
                    currency: 'ETH',
                    status: 'completed',
                    betId: bet._id,
                    description: `Bet on ${bet.contestant1.name} in ${bet.tournamentName}: ${bet.matchName}`
                  });
                  
                  await Transaction.create({
                    user: testUsers[1]._id,
                    type: 'bet',
                    amount: 0.08,
                    currency: 'ETH',
                    status: 'completed',
                    betId: bet._id,
                    description: `Bet on ${bet.contestant2.name} in ${bet.tournamentName}: ${bet.matchName}`
                  });
                }
              } catch (error) {
                console.error(`Error fetching sets for phase ${phase.id}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing tournament ${tournamentData.name}:`, error);
        }
      }
      
      console.log('Database seeding completed!');
    } catch (error) {
      console.error('Error fetching tournaments from Start.GG:', error);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
};

module.exports = seedDatabase;