const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../../models/User');
const crypto = require('crypto');

// Set up Google OAuth strategy
const setupGoogleAuth = () => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `http://localhost:3001/api/auth/google/callback`,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // User exists - update their Google ID if not already set
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        return done(null, user);
      }
      
      // User doesn't exist - create a new account
      const username = `user_${crypto.randomBytes(4).toString('hex')}`;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      
      // Create new user
      user = await User.create({
        email: profile.emails[0].value,
        username: username,
        password: randomPassword,
        googleId: profile.id,
        emailVerified: true // Auto-verify email for Google auth
      });
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
};

module.exports = { setupGoogleAuth };