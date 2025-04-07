const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Configure upload directory
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this resource');
  res.redirect('/auth/login');
}

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash('error_msg', 'Please log in first');
  res.redirect('/auth/login');
};

// Helper to check file existence
const fileExists = (filePath) => {
  try {
    return fs.existsSync(path.join(__dirname, '../public', filePath));
  } catch (err) {
    return false;
  }
};

// Register Handlebars helper for file existence
const hbs = require('hbs');
hbs.registerHelper('fileExists', function(filePath, options) {
  return fileExists(filePath) ? options.fn(this) : options.inverse(this);
});

// GET form to add new recipe
router.get('/new', isAuthenticated, (req, res) => {
  res.render('recipes/new', {
    title: 'Add New Recipe',
    user: req.user
  });
});

// GET all recipes
router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('creator', 'username')
      .lean();
    res.render('recipes/list', {
      title: 'All Recipes',
      recipes
    });
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).render('error', { 
      message: 'Failed to load recipes',
      error: err
    });
  }
});

// Show single recipe
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      req.flash('error_msg', 'Invalid recipe ID');
      return res.redirect('/recipes');
    }

    const recipe = await Recipe.findById(req.params.id)
      .populate('creator', 'username')
      .lean();

    if (!recipe) {
      req.flash('error_msg', 'Recipe not found');
      return res.redirect('/recipes');
    }

    // Verify image exists
    recipe.imageExists = recipe.image ? fileExists(recipe.image) : false;

    res.render('recipes/show', {
      title: recipe.title,
      recipe,
      user: req.user
    });
  } catch (err) {
    console.error('Error fetching recipe:', err);
    req.flash('error_msg', 'Error loading recipe');
    res.redirect('/recipes');
  }
});

// POST handle new recipe submission
router.post('/', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { title, description, ingredients, instructions, prepTime, servings, difficulty, tags } = req.body;

    // Basic validation
    if (!title || !description) {
      throw new Error('Title and description are required');
    }

    // Process ingredients
    const processedIngredients = Array.isArray(ingredients) 
      ? ingredients.filter(i => i.trim()) 
      : [ingredients].filter(i => i && i.trim());

    // Process tags
    const processedTags = tags ? tags.split(',').map(t => t.trim()) : [];

    const newRecipe = new Recipe({
      title,
      description,
      ingredients: processedIngredients,
      instructions,
      prepTime: parseInt(prepTime) || 0,
      servings: parseInt(servings) || 1,
      difficulty: difficulty || 'Medium',
      tags: processedTags,
      creator: req.user._id,
      image: req.file ? '/uploads/' + req.file.filename : null
    });

    await newRecipe.save();
    req.flash('success_msg', 'Recipe added successfully!');
    res.redirect(`/recipes/${newRecipe._id}`);
  } catch (err) {
    console.error('Error saving recipe:', err);
    
    // Clean up uploaded file if error occurred
    if (req.file) {
      fs.unlink(path.join(uploadDir, req.file.filename), () => {});
    }

    req.flash('error_msg', err.message || 'Failed to save recipe');
    res.redirect('back');
  }
});

// Edit Recipe Form
router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      creator: req.user._id // Only allow creator to edit
    });
    
    if (!recipe) {
      req.flash('error_msg', 'Recipe not found or you are not authorized');
      return res.redirect('/recipes');
    }
    
    res.render('recipes/edit', { recipe });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Update Recipe
router.put('/:id', ensureAuthenticated, upload.single('image'), async (req, res) => {
  try {
    let recipe = await Recipe.findOne({
      _id: req.params.id,
      creator: req.user._id
    });
    
    if (!recipe) {
      req.flash('error_msg', 'Recipe not found or not authorized');
      return res.redirect('/recipes');
    }
    
    // Update recipe fields
    recipe.title = req.body.title;
    recipe.description = req.body.description;
    recipe.ingredients = Array.isArray(req.body.ingredients) 
      ? req.body.ingredients 
      : [req.body.ingredients];
    recipe.instructions = req.body.instructions;
    recipe.prepTime = req.body.prepTime;
    recipe.servings = req.body.servings;
    recipe.difficulty = req.body.difficulty;
    recipe.tags = req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [];
    
    if (req.file) {
      // Delete old image if exists
      if (recipe.image) {
        const oldImagePath = path.join(__dirname, '../public', recipe.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      recipe.image = '/uploads/' + req.file.filename;
    }
    
    await recipe.save();
    req.flash('success_msg', 'Recipe updated successfully');
    res.redirect(`/recipes/${recipe._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating recipe');
    res.redirect('back');
  }
});

// Delete Recipe
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const recipe = await Recipe.findOneAndDelete({
      _id: req.params.id,
      creator: req.user._id
    });
    
    if (!recipe) {
      req.flash('error_msg', 'Recipe not found or not authorized');
      return res.redirect('/recipes');
    }
    
    // Delete associated image
    if (recipe.image) {
      const imagePath = path.join(__dirname, '../public', recipe.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    req.flash('success_msg', 'Recipe deleted successfully');
    res.redirect('/recipes');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting recipe');
    res.redirect('back');
  }
});

module.exports = router;