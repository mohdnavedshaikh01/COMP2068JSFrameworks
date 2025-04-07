const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const { ensureAuthenticated } = require('../middleware/auth');

// Local auth middleware
const isAuthenticated = (req, res, next) => {
  console.log('Auth check - is authenticated:', req.isAuthenticated());
  if (req.isAuthenticated()) return next();
  console.log('Redirecting to login');
  req.flash('error_msg', 'Please log in first');
  res.redirect('/auth/login');
};

// GET form to create new challenge
router.get('/add', isAuthenticated, (req, res) => {
  console.log('GET /challenges/add route hit'); // Debug log
  console.log('User authenticated:', req.isAuthenticated()); // Debug log   
  res.render('challenges/add', {
    title: 'Create Challenge',
    user: req.user,
    scripts: ['/js/challenges.js'] // Add scripts this way instead
  });
});

// Get all challenges
router.get('/', async (req, res) => {
  try {
    const challenges = await Challenge.find({ isActive: true })
    .populate('creator', '_id username')
    // .populate('creator', 'username') // Add this line
    .populate('participants')
    .populate('recipes')
    .lean(); // Convert to plain JS object

    console.log('Fetched challenges:', challenges);

    res.render('challenges/index', { 
      challenges,
      title: 'Current Challenges',
      user: req.user || null,
    });
  } catch (err) {
    console.error(err);
    res.render('error');
  }
});

// Get single challenge
router.get('/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
    .populate('creator', '_id username')
      .populate('participants')
      .populate('recipes')
    res.render('challenges/show', { 
      challenge,
      user: req.user, 
      title: challenge.title
    });
  } catch (err) {
    console.error(err);
    res.render('error');
  }
});


// Add Challenge Form
router.get('/add', isAuthenticated, (req, res) => {
  console.log('Rendering add challenge form');
  try {
    res.render('challenges/add', {
      title: 'Create Challenge',
      user: req.user,
      layout: 'layout' // Explicitly specify your layout
    });
  } catch (err) {
    console.error('Render error:', err);
    res.status(500).send('Error loading form');
  }
});

// POST - Handle Challenge Creation
router.post('/add', isAuthenticated, async (req, res) => {
  try {
    const { title, description, theme, startDate, endDate, prize, rules } = req.body;

    // Create a new challenge
    const newChallenge = new Challenge({
      title,
      description,
      theme,
      startDate,
      endDate,
      prize,
      rules: rules.split('\n'), // Split rules into an array
      participants: [req.user._id], // Add the creator as a participant
      isActive: true,
      creator: req.user._id
    });

    // Save to MongoDB
    await newChallenge.save();

    req.flash('success_msg', 'Challenge created successfully!');
    res.redirect('/challenges');
  } catch (err) {
    console.error('Error creating challenge:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      req.flash('error_msg', messages.join(', '));
    } else {
      req.flash('error_msg', 'Failed to create challenge');
    }
    
    res.redirect('/challenges/add');
  }
});

// DELETE challenge
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    // Find and delete only if user is creator
    const challenge = await Challenge.findOneAndDelete({
      _id: req.params.id,
      creator: req.user._id
    });

    if (!challenge) {
      req.flash('error_msg', 'Challenge not found or not authorized');
      return res.redirect('/challenges');
    }

    req.flash('success_msg', 'Challenge deleted successfully');
    res.redirect('/challenges');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting challenge');
    res.redirect('back');
  }
});

module.exports = router;