const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('./auth');
const Recipe = require('../models/Recipe');
const Challenge = require('../models/Challenge');
const User = require('../models/User'); // Added User import
const moment = require('moment'); // Added moment import

// Combined home page route
router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find()
    .populate('creator', 'username')
    .limit(3);
    const challenges = await Challenge.find({ isActive: true });
    
    res.render('index', { 
      title: 'CookOff - Home',
      recipes,
      challenges,
      user: req.user,
      layout: 'layout'
    });
  } catch (err) {
    res.render('error', {
      title: 'Error',
      error: err,
      layout: 'layout'
    });
  }
});

// Leaderboard route
router.get('/leaderboard', async (req, res) => {
  try {
    const startOfWeek = moment().startOf('week').toDate();
    const topUsers = await User.find({ 
      joinedAt: { $gte: startOfWeek }
    })
    .sort({ points: -1 })
    .limit(10);
    
    res.render('leaderboard', { 
      users: topUsers,
      weekStart: moment(startOfWeek).format('MMM Do'),
      weekEnd: moment().endOf('week').format('MMM Do'),
      title: 'Weekly Leaderboard'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      error: err,
      layout: 'layout'
    });
  }
});

module.exports = router;