const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

const app = express();

// Configure Handlebars
app.engine('hbs', engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Import Routes
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));  // Use backticks for template literals
