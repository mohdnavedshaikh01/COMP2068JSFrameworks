// DOM Ready Function
document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Dynamic ingredient fields
  const addIngredientBtn = document.getElementById('addIngredient');
  const ingredientsContainer = document.getElementById('ingredientsContainer');
  
  if (addIngredientBtn && ingredientsContainer) {
    addIngredientBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const newIngredient = document.createElement('div');
      newIngredient.classList.add('input-group', 'mb-2');
      newIngredient.innerHTML = `
        <input type="text" name="ingredients" class="form-control" required>
        <button class="btn btn-outline-danger remove-ingredient" type="button" data-bs-toggle="tooltip" title="Remove ingredient">
          <i class="fas fa-times"></i>
        </button>
      `;
      ingredientsContainer.appendChild(newIngredient);
    });

    ingredientsContainer.addEventListener('click', function(e) {
      if (e.target.classList.contains('remove-ingredient') || 
          e.target.closest('.remove-ingredient')) {
        e.preventDefault();
        const ingredientGroup = e.target.closest('.input-group');
        if (ingredientGroup) {
          ingredientGroup.remove();
        }
      }
    });
  }

  // Image preview for forms
  const imageInputs = document.querySelectorAll('.image-upload');
  imageInputs.forEach(input => {
    const previewId = input.dataset.preview;
    const previewElement = document.getElementById(previewId);
    
    if (previewElement) {
      input.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
            previewElement.innerHTML = `
              <img src="${e.target.result}" class="img-thumbnail d-block mb-2" style="max-height: 200px;">
              <button class="btn btn-sm btn-danger remove-image" type="button">
                Remove Image
              </button>
            `;
            
            // Add remove image functionality
            previewElement.querySelector('.remove-image').addEventListener('click', function() {
              input.value = '';
              previewElement.innerHTML = '';
            });
          }
          reader.readAsDataURL(file);
        }
      });
    }
  });

  // Delete confirmation
  const deleteForms = document.querySelectorAll('.delete-form');
  deleteForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to delete this item?')) {
        this.submit();
      }
    });
  });

  // Rating system
  const ratingStars = document.querySelectorAll('.rating-star');
  ratingStars.forEach(star => {
    star.addEventListener('click', function() {
      const rating = this.getAttribute('data-rating');
      const ratingInput = document.getElementById('ratingValue');
      if (ratingInput) {
        ratingInput.value = rating;
      }
      
      // Update star display
      ratingStars.forEach(s => {
        if (s.getAttribute('data-rating') <= rating) {
          s.classList.add('text-warning');
        } else {
          s.classList.remove('text-warning');
        }
      });
    });
  });

  // Time formatting
  document.querySelectorAll('[data-time]').forEach(element => {
    const timestamp = element.getAttribute('data-time');
    element.textContent = formatTimeAgo(timestamp);
  });
});

// Format time ago
function formatTimeAgo(timestamp) {
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `${interval} ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return 'Just now';
}

// Search functionality
function searchRecipes() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const recipeCards = document.querySelectorAll('.recipe-card');
  
  recipeCards.forEach(card => {
    const title = card.querySelector('.recipe-title').textContent.toLowerCase();
    const description = card.querySelector('.recipe-description').textContent.toLowerCase();
    const ingredients = card.querySelector('.recipe-ingredients').textContent.toLowerCase();
    
    if (title.includes(searchTerm) || 
        description.includes(searchTerm) || 
        ingredients.includes(searchTerm)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}