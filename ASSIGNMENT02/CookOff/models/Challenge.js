const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  theme: {
    type: String,
    required: [true, 'Please add a theme']
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  recipes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Recipe' 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  prize: String,
  rules: [String]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for duration in days
ChallengeSchema.virtual('durationDays').get(function() {
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
});

module.exports = mongoose.model('Challenge', ChallengeSchema);