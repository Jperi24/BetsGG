// src/models/Tournament.js
const mongoose = require('mongoose');

const phaseSchema = new mongoose.Schema({
  id: String,
  name: String,
  numSeeds: Number,
  bracketType: String
}, { _id: false });

const videogameSchema = new mongoose.Schema({
  id: String,
  name: String,
  displayName: String
}, { _id: false });

const eventSchema = new mongoose.Schema({
  id: String,
  name: String,
  numEntrants: Number,
  videogame: videogameSchema,
  phases: [phaseSchema]
}, { _id: false });

const imageSchema = new mongoose.Schema({
  url: String
}, { _id: false });

const tournamentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  startAt: {
    type: Number, // Unix timestamp
    required: true
  },
  endAt: {
    type: Number, // Unix timestamp
    required: true
  },
  numAttendees: {
    type: Number,
    default: 0
  },
  countryCode: String,
  addrState: String,
  city: String,
  venueAddress: String,
  images: [imageSchema],
  events: [eventSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create an index for date-based queries
tournamentSchema.index({ startAt: 1, endAt: 1 });

// Method to check if tournament is currently ongoing
tournamentSchema.methods.isOngoing = function() {
  const now = Math.floor(Date.now() / 1000);
  return this.startAt <= now && this.endAt >= now;
};

// Method to check if tournament is upcoming
tournamentSchema.methods.isUpcoming = function() {
  const now = Math.floor(Date.now() / 1000);
  return this.startAt > now;
};

// Method to check if tournament has finished
tournamentSchema.methods.isFinished = function() {
  const now = Math.floor(Date.now() / 1000);
  return this.endAt < now;
};

// Virtual for formatted start date
tournamentSchema.virtual('startDate').get(function() {
  return new Date(this.startAt * 1000).toISOString();
});

// Virtual for formatted end date
tournamentSchema.virtual('endDate').get(function() {
  return new Date(this.endAt * 1000).toISOString();
});

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;