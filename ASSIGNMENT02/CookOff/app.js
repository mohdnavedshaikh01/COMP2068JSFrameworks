require('dotenv').config();
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const { engine } = require('express-handlebars');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const debug = require('debug')('app:server');
const methodOverride = require('method-override');
const fs = require('fs');

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

// View engine setup with all required helpers
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views'),
  helpers: {

    stars: function(n, options) {
      const full = Math.floor(n);
      const half = n % 1 >= 0.5 ? 1 : 0;
      const empty = 5 - full - half;
      
      let result = '';
      for (let i = 0; i < full; i++) {
        result += options.fn({ full: true, empty: false });
      }
      if (half) {
        result += options.fn({ full: false, empty: false });
      }
      for (let i = 0; i < empty; i++) {
        result += options.fn({ full: false, empty: true });
      }
      return result;
    },

    // Comparison helpers
    eq: (a, b) => {
  if (!a || !b) return false;
  return a.toString() === b.toString();
},
    neq: (a, b) => a !== b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    gte: (a, b) => a >= b,
    lte: (a, b) => a <= b,
    
    // Array helpers
    includes: (array, value) => array && array.includes(value),
    length: (array) => array ? array.length : 0,
    
    // String helpers
    truncate: (str, len) => str && str.length > len ? str.substring(0, len) + '...' : str,
    uppercase: (str) => str && str.toUpperCase(),
    lowercase: (str) => str && str.toLowerCase(),
    
    // Date helpers
    formatDate: (date) => date && new Date(date).toLocaleDateString(),
    
    // Logical helpers
    and: (a, b) => a && b,
    or: (a, b) => a || b,
    not: (a) => !a,
    
    // Math helpers
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => a / b,
    
    // Special helpers for challenges
    isCreator: (creatorId, userId) => creatorId && userId && creatorId.toString() === userId.toString(),
    isParticipant: (participants, userId) => participants && userId && participants.some(p => p.toString() === userId.toString()),
    
    // Debug helper
    debug: (value) => console.log(value) || '',
    
    // Content blocks
    contentFor: function(name, options) {
      const blocks = this._blocks || (this._blocks = {});
      const block = blocks[name] || (blocks[name] = []);
      block.push(options.fn(this));
    },
    yield: function(name) {
      const blocks = this._blocks || {};
      return blocks[name] ? blocks[name].join('\n') : '';
    }
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));

// Add this helper in your handlebars configuration
hbs.handlebars.registerHelper('fileExists', function(filepath, options) {
  const fs = require('fs');
  const path = require('path');
  const fullPath = path.join(__dirname, '..', 'public', filepath);
  
  try {
    return fs.existsSync(fullPath) ? 
      options.fn(this) : 
      options.inverse(this);
  } catch (err) {
    return options.inverse(this);
  }
});

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('public/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production',
            domain: 'cookoff-wudg.onrender.com'
}
}));

// Method override for PUT/DELETE forms
app.use(methodOverride('_method'));


// Passport initialization
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/recipes', recipesRouter);
app.use('/challenges', challengesRouter);
app.use('/leaderboard', leaderboardRouter);

// Error handlers
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    status: 404,
    message: 'The page you are looking for does not exist.'
  });
});

app.use((err, req, res, next) => {
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
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

