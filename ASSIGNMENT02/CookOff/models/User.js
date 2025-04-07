const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    unique: true,
    trim: true,
    required: [true, 'Username is required'],  // Added validation
    minlength: [3, 'Username must be at least 3 characters']
  },
  password: {
    type: String,
    select: true,
    required: [true, 'Password is required'],  // Added validation
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
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

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

UserSchema.virtual('recipes', {
  ref: 'Recipe',
  localField: '_id',
  foreignField: 'creator',
  justOne: false
});

module.exports = mongoose.model('User', UserSchema);