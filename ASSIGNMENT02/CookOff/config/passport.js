const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Validate required environment variables
function validateEnv() {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    throw new Error('GitHub OAuth credentials not configured');
  }
}

// Passport Configuration
function setupPassport(passport) {
  // Verify environment variables first
  validateEnv();

  // Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password'
      },
      async (username, password, done) => {
        try {
          const user = await User.findOne({ username });
          if (!user) {
            return done(null, false, { message: 'Incorrect username' });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: 'Incorrect password' });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // GitHub Strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
        scope: ['user:email'],
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Check for existing user by GitHub ID or email
          let user = await User.findOne({ 
            $or: [
              { githubId: profile.id },
              { email: profile.emails?.[0]?.value }
            ]
          });

          if (!user) {
            // Create new user if not found
            user = new User({
              githubId: profile.id,
              username: profile.username,
              email: profile.emails?.[0]?.value,
              displayName: profile.displayName || profile.username,
              avatarUrl: profile.photos?.[0]?.value,
              isVerified: true
            });
            await user.save();
          } else if (!user.githubId) {
            // Link GitHub to existing account
            user.githubId = profile.id;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          console.error('GitHub auth error:', err);
          return done(err);
        }
      }
    )
  );

  // Session Serialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Session Deserialization
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

// Authentication Middleware
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/auth/login');
};

const ensureGuest = (req, res, next) => {
  if (!req.isAuthenticated()) return next();
  res.redirect('/dashboard');
};

module.exports = function(passport) {
  setupPassport(passport);
  return {
    ensureAuthenticated,
    ensureGuest
  };
};