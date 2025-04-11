# CookOff - Culinary Challenge Platform 🍳🏆

## About the Project

CookOff is an interactive web application where cooking enthusiasts can compete in culinary challenges, share recipes, and track their progress. Built as a full-stack application, it features user authentication, real-time leaderboards, and a responsive design for seamless use across devices.

## Live Website
- Access the deployed application at:  
  

## View Files and Their Functions

### layouts/main.hbs
- Base template for all pages
- Contains the navigation bar, footer, and global CSS/JS includes
- Uses `{{{body}}}` to render dynamic content

### home.hbs
- Landing page with featured challenges
- Displays ongoing competitions with countdown timers
- Shows recent recipe submissions from participants

### challenges.hbs
- Challenge listing page with filter options
- Detailed challenge view with participation controls
- Submission form for recipe entries

### recipes.hbs
- Gallery view of all submitted recipes
- Detailed recipe pages with ratings and comments
- Interactive cooking instructions with step-by-step guide

### leaderboard.hbs
- Real-time ranking of top participants
- Visual progress indicators
- Badge system for achievement recognition

### profile.hbs
- User dashboard with personal stats
- Shows completed challenges and created recipes
- Achievement showcase section

## Tech Stack

### Frontend:
- Handlebars.js for templating
- Bootstrap 5 with custom styling
- FontAwesome for food-themed icons
- Chart.js for leaderboard visualizations

### Backend:
- Node.js with Express.js
- MongoDB with Mongoose ODM
- Passport.js for authentication
- Multer for image uploads

### Deployment:
- Hosted on Render
- MongoDB Atlas for database
- Cloudinary for image storage (optional)

## Features

- **User Authentication**: Local and GitHub OAuth login
- **Culinary Challenges**: Time-limited cooking competitions
- **Recipe Management**: Create, share, and rate recipes
- **Interactive Leaderboard**: Real-time ranking system
- **Responsive Design**: Optimized for all device sizes
- **Social Features**: Recipe comments and ratings

## External Resources Used

- [Bootstrap 5](https://getbootstrap.com/) - Responsive UI framework
- [FontAwesome](https://fontawesome.com/) - Icons
- [Express.js](https://expressjs.com/) - Web application framework
- [Handlebars.js](https://handlebarsjs.com/) - Templating engine
- [Passport.js](http://www.passportjs.org/) - Authentication middleware
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [Multer](https://github.com/expressjs/multer) - File upload handling



