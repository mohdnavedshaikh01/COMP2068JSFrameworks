const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    unique: true,
    trim: true,
    required: [true, 'Username is required'],
    minlength: [3, 'Username must be at least 3 characters']
  },
  password: {
    type: String,
    select: true,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  githubId: String,
  displayName: String,
  avatarUrl: String,
  points: { 
    type: Number, 
    default: 0 
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  // Challenge participation tracking
  challengesParticipated: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  }],
  challengesWon: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  }],
  // Recipe tracking
  recipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  // Badges/achievements
  badges: [{
    type: String,
    enum: ['novice', 'chef', 'master', 'champion']
  }],
  // Rating statistics
  ratingStats: {
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

// Virtual for recipe count
UserSchema.virtual('recipeCount').get(function() {
  return this.recipes.length;
});

// Virtual for challenge participation count
UserSchema.virtual('challengeCount').get(function() {
  return this.challengesParticipated.length;
});

// Virtual for wins count
UserSchema.virtual('winCount').get(function() {
  return this.challengesWon.length;
});

// Password comparison method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};



// Password hashing middleware
UserSchema.pre('save', async function(next) { 
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Update rating stats when new rating is added (to be called from Recipe model)
UserSchema.methods.updateRatingStats = async function() {
  const recipes = await mongoose.model('Recipe').find({ creator: this._id });
  const ratings = recipes.flatMap(recipe => recipe.ratings);
  
  this.ratingStats = {
    averageRating: ratings.length > 0 
      ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length)
      : 0,
    totalRatings: ratings.length
  };
  
  await this.save();
};

// Check and award badges based on points
UserSchema.methods.checkBadges = async function() {
  const badges = [];
  
  if (this.points >= 50) badges.push('novice');
  if (this.points >= 200) badges.push('chef');
  if (this.points >= 500) badges.push('master');
  if (this.points >= 1000) badges.push('champion');
  
  // Only add new badges, don't remove existing ones
  this.badges = [...new Set([...this.badges, ...badges])];
  await this.save();
};

module.exports = mongoose.model('User', UserSchema);