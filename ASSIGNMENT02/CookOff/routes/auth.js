const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureAuthenticated, forwardAuthenticated } = require('../middleware/auth');
const User = require('../models/User');

// Add this temporary test route
router.get('/test-session', (req, res) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  res.json({
    session: req.session,
    user: req.user
  });
});

// Login page
router.get('/login', forwardAuthenticated, (req, res) => {
  res.render('auth/login', { 
    message: req.flash('error'),
    title: 'Login'
  });
});

// Login handler
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/auth/login',
  failureFlash: true
}));

// GitHub auth
router.get('/github', passport.authenticate('github'));
router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/auth/login' }),
  (req, res) => res.redirect('/')
);

// Register page
router.get('/register', forwardAuthenticated, (req, res) => {
  res.render('auth/register', { 
    title: 'Register'
  });
});

router.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  
  // Validation
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/auth/register');
  }

  try {
    // Check for existing user (case insensitive)
    const existingUser = await User.findOne({ 
      username: new RegExp(`^${username}$`, 'i') 
    });
    
    if (existingUser) {
      req.flash('error', 'Username already exists');
      return res.redirect('/auth/register');
    }

    // Create and save new user
    const user = new User({ username, password });
    await user.save();

    // Log in the new user
    req.login(user, (err) => {
      if (err) {
        console.error('Login after registration error:', err);
        req.flash('error', 'Registration successful but login failed');
        return res.redirect('/auth/login');
      }
      res.redirect('/');
    });

  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      req.flash('error', messages.join(', '));
    } else {
      req.flash('error', 'Registration failed. Please try again.');
    }
    
    res.redirect('/auth/register');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.redirect('/');
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');
  });
});

module.exports = router;