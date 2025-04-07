// assignment2/cookoff/middleware/auth.js
module.exports = {
  /**
   * Redirect authenticated users away from auth pages (login/register)
   * Usage: router.get('/login', forwardAuthenticated, (req, res) => {...});
   */
  forwardAuthenticated: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next(); // Important: return here
    }
    // Explicit return prevents double response
    return res.redirect('/dashboard'); 
  },

  /**
   * Protect routes that require authentication
   * Usage: router.get('/profile', ensureAuthenticated, (req, res) => {...});
   */
  ensureAuthenticated: function(req, res, next) {
    // Debugging info (remove in production)
    console.log('Auth Check - Session:', req.sessionID);
    console.log('Auth Check - User:', req.user ? req.user.id : 'none');
    
    if (req.isAuthenticated()) {
      return next(); // Important: return here
    }
    
    req.flash('error', 'Please login to access this page');
    // Explicit return prevents further middleware execution
    return res.redirect('/auth/login'); 
  },

  /**
   * Admin-only access middleware
   * Usage: router.get('/admin', ensureAdmin, (req, res) => {...});
   */
  ensureAdmin: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    
    req.flash('error', 'Admin privileges required');
    return res.redirect('/');
  },
  
  /**
   * New: Prevent infinite redirects
   */
  safeRedirect: function(req, res, next) {
    // Skip if already going to login
    if (req.path === '/auth/login') return next(); 
    
    // Store original URL before auth check
    req.session.returnTo = req.originalUrl; 
    next();
  }
};