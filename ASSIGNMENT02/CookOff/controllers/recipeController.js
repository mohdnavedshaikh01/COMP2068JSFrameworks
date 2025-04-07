const Recipe = require('../models/Recipe');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');
const mongoose = require('mongoose');

// @desc    Get all recipes
// @route   GET /api/v1/recipes
// @route   GET /api/v1/challenges/:challengeId/recipes
// @access  Public
exports.getRecipes = asyncHandler(async (req, res, next) => {
  if (req.params.challengeId) {
    const recipes = await Recipe.find({ challenge: req.params.challengeId })
      .populate('creator', 'username avatarUrl')
      .populate('challenge', 'title');

    return res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single recipe
// @route   GET /api/v1/recipes/:id
// @access  Public
exports.getRecipe = asyncHandler(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.id)
    .populate('creator', 'username avatarUrl')
    .populate('challenge', 'title')
    .populate('ratings.user', 'username avatarUrl');

  if (!recipe) {
    return next(
      new ErrorResponse(`Recipe not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: recipe
  });
});

// @desc    Create new recipe
// @route   POST /api/v1/recipes
// @route   POST /api/v1/challenges/:challengeId/recipes
// @access  Private
exports.createRecipe = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.creator = req.user.id;

  // If challenge is specified
  if (req.params.challengeId) {
    req.body.challenge = req.params.challengeId;
  }

  const recipe = await Recipe.create(req.body);

  res.status(201).json({
    success: true,
    data: recipe
  });
});

// @desc    Update recipe
// @route   PUT /api/v1/recipes/:id
// @access  Private
exports.updateRecipe = asyncHandler(async (req, res, next) => {
  let recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    return next(
      new ErrorResponse(`Recipe not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is recipe creator or admin
  if (recipe.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this recipe`,
        401
      )
    );
  }

  recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: recipe
  });
});

// @desc    Delete recipe
// @route   DELETE /api/v1/recipes/:id
// @access  Private
exports.deleteRecipe = asyncHandler(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    return next(
      new ErrorResponse(`Recipe not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is recipe creator or admin
  if (recipe.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this recipe`,
        401
      )
    );
  }

  await recipe.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload photo for recipe
// @route   PUT /api/v1/recipes/:id/photo
// @access  Private
exports.uploadRecipePhoto = asyncHandler(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    return next(
      new ErrorResponse(`Recipe not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is recipe creator or admin
  if (recipe.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this recipe`,
        401
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${recipe._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Recipe.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});

// @desc    Rate a recipe
// @route   PUT /api/v1/recipes/:id/rate
// @access  Private
exports.rateRecipe = asyncHandler(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    return next(
      new ErrorResponse(`Recipe not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user already rated
  const existingRating = recipe.ratings.find(
    rating => rating.user.toString() === req.user.id
  );

  if (existingRating) {
    // Update existing rating
    existingRating.score = req.body.score;
  } else {
    // Add new rating
    recipe.ratings.push({
      user: req.user.id,
      score: req.body.score
    });
  }

  await recipe.save();

  res.status(200).json({
    success: true,
    data: recipe
  });
});