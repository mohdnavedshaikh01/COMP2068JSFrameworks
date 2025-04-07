require('dotenv').config();
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const { engine } = require('express-handlebars');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const morgan = require('morgan');
const debug = require('debug')('app:server');
// const hbsLayouts = require('express-handlebars-layouts');

// Import routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const recipesRouter = require('./routes/recipes');
const challengesRouter = require('./routes/challenges');
const leaderboardRouter = require('./routes/leaderboard');



// Database connection
const connectDB = require('./config/db');
connectDB();

const app = express();

// View engine setup
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views'),
  helpers: {

    includes: function(array, value) {
      return array.includes(value);
    },
    
    // Comparison helpers
    eq: (a, b) => a === b,
    gt: (a, b) => a > b,
    
    // String helpers
    truncate: (str, len) => str.length > len ? str.substring(0, len) + '...' : str,
    
    // Date helpers
    formatDate: (date) => new Date(date).toLocaleDateString(),
    
    // Layout helpers
    contentFor: function(name, options) {
      const blocks = this._blocks || (this._blocks = {});
      const block = blocks[name] || (blocks[name] = []);
      block.push(options.fn(this));
    },
    yield: function(name) {
      const blocks = this._blocks || {};
      return blocks[name] || '';
    }
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  },

  fileExists: function(filepath) {
    try {
      return fs.existsSync(path.join(__dirname, '../public', filepath));
    } catch (err) {
      return false;
    }
  }

}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

hbs.registerHelper('contentFor', function(name, options) {
  const blocks = this._blocks || (this._blocks = {});
  const block = blocks[name] || (blocks[name] = []);
  block.push(options.fn(this));
});

// Enhanced middleware with debugging
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files with debugging
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    debug(`Serving static file: ${path}`);
  }
}));


// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Passport initialization
require('./config/passport')(passport); // This line does both config and initialization
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Passport config
require('./config/passport')(passport); ;

// Global variables middleware with route logging
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Route debugging middleware
app.use((req, res, next) => {
  debug(`Route entered: ${req.originalUrl}`);
  next();
});

// Routes with registration logging
app.use('/', (req, res, next) => {
  debug('Entering index routes');
  next();
}, indexRouter);

app.use('/auth', (req, res, next) => {
  debug('Entering auth routes');
  next();
}, authRouter);

app.use('/recipes', (req, res, next) => {
  debug('Entering recipes routes');
  next();
}, recipesRouter);

app.use('/challenges', (req, res, next) => {
  debug('Entering challenges routes');
  next();
}, challengesRouter);

app.use('/leaderboard', (req, res, next) => {
  debug('Entering leaderboard routes');
  next();
}, leaderboardRouter);

// Test route
app.get('/test', (req, res) => {
  debug('Test route accessed');
  res.send('Test route is working!');
});

// Enhanced 404 handler
app.use((req, res, next) => {
  debug(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).render('error', {
    title: 'Page Not Found',
    status: 404,
    message: 'The page you are looking for does not exist.',
    suggestedRoutes: [
      { path: '/', name: 'Home' },
      { path: '/recipes', name: 'Recipes' },
      { path: '/challenges', name: 'Challenges' }
    ]
  });
});

// Error handler with detailed logging
app.use((err, req, res, next) => {
  debug(`Error occurred: ${err.stack}`);
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    status: 500,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  debug(`Server running on http://localhost:${PORT}`);
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Truncate long text
hbs.registerHelper('truncate', (str, len) => {
  if (str.length > len) {
    return str.substring(0, len) + '...';
  }
  return str;
});

// // Format date helper
// hbs.registerHelper('formatDate', (date, format) => {
//   if (!date) return '';
//   return moment(date).format(format);
// });