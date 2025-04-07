const express = require('express');
const router = express.Router();
const User = require('../models/User');
const moment = require('moment');

// Weekly leaderboard
router.get('/', async (req, res) => {
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
    res.render('error');
  }
});

module.exports = router;