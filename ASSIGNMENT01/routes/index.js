const express = require('express');
const router = express.Router();

// Define Routes
router.get('/', (req, res) => res.render('home', { title: 'Home' }));
router.get('/about', (req, res) => res.render('about', { title: 'About Me' }));
router.get('/projects', (req, res) => res.render('projects', { title: 'Projects' }));
router.get('/contact', (req, res) => res.render('contact', { title: 'Contact Me' }));

module.exports = router;