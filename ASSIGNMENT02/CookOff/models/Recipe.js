const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
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
  ingredients: { 
    type: [String], 
    required: [true, 'Please add at least one ingredient'] 
  },
  instructions: { 
    type: String, 
    required: [true, 'Please add instructions'] 
  },
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  prepTime: {
    type: Number,
    required: [true, 'Please add preparation time'],
    min: [1, 'Preparation time must be at least 1 minute']
  },
  servings: {
    type: Number,
    min: [1, 'Servings must be at least 1']
  },
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  imageUrl: String,
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, min: 1, max: 5 }
  }],
  challenge: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Challenge' 
  },
  tags: [String]
});

// Calculate average rating
RecipeSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, item) => acc + item.score, 0);
  return sum / this.ratings.length;
});

module.exports = mongoose.model('Recipe', RecipeSchema);