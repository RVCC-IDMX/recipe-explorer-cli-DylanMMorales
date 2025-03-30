// src/app.js
/**
 * Main application file for the Recipe Explorer
 * Contains the command-line interface and application logic
 */

import readlineSync from 'readline-sync';
import * as api from './api.js';
import * as cache from './cache.js';
import * as favorites from './favorites.js';
import * as utils from './utils.js';

/**
 * Initialize the application
 *
 * @returns {Promise<boolean>} - True if initialization successful
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all | MDN: Promise.all}
 */
async function initialize() {
  try {
    await Promise.all([cache.initialize(), favorites.initialize()]);
    cache.clearExpired();
    return true;
  } catch (error) {
    console.error('Initialization error:', error);
    return false;
  }
}

/**
 * Search for recipes with caching
 * Demonstrates using cache before making API calls
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises | MDN: Using promises}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch | MDN: try...catch}
 */
async function searchRecipes() {
  const query = readlineSync.question('Enter search term: ');

  if (!query.trim()) {
    console.log('Search term cannot be empty');
    return;
  }

  console.log(`Searching for "${query}"...`);

  try {
    const cacheKey = `search_${query.toLowerCase()}`;
    const cachedResults = await cache.getCachedOrFetch(cacheKey, () => api.searchMealsByName(query));

    if (Array.isArray(cachedResults) && cachedResults.length === 0) {
      console.log('No recipes found.');
      return;
    }

    console.log(utils.formatRecipeList(cachedResults));

    const viewDetails = readlineSync.keyInYNStrict('Would you like to view details for a recipe?');

    if (viewDetails) {
      const index = readlineSync.questionInt(`Enter recipe number (1-${cachedResults.length}): `, {
        limit: input => {
          const num = parseInt(input);
          return num >= 1 && num <= cachedResults.length;
        },
        limitMessage: `Please enter a number between 1 and ${cachedResults.length}`
      });

      await viewRecipeDetails(cachedResults[index - 1].idMeal);
    }
  } catch (error) {
    console.error('Error searching recipes:', error.message);
  }
}

/**
 * View recipe details with related recipes
 * Demonstrates Promise chaining
 *
 * @param {string} recipeId - ID of recipe to view
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises | MDN: Using promises}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then | MDN: Promise.then}
 */
async function viewRecipeDetails(recipeId) {
  if (!recipeId) {
    recipeId = readlineSync.question('Enter recipe ID: ');
  }

  if (!recipeId.trim()) {
    console.log('Recipe ID cannot be empty');
    return;
  }

  console.log(`Fetching details for recipe ${recipeId}...`);

  try {
    const cacheKey = `recipe_${recipeId}`;
    const recipe = await cache.getCachedOrFetch(cacheKey, () => api.getRecipeById(recipeId));

    if (!recipe) {
      console.log('Recipe not found');
      return;
    }

    console.log(utils.formatRecipe(recipe));

    const isFavorite = await favorites.isFavorite(recipeId);

    if (isFavorite) {
      const removeFavorite = readlineSync.keyInYNStrict('Would you like to remove this recipe from favorites?');
      if (removeFavorite) {
        await favorites.removeFavorite(recipeId);
        console.log('Recipe removed from favorites');
      }
    } else {
      const addFavorite = readlineSync.keyInYNStrict('Would you like to add this recipe to favorites?');
      if (addFavorite) {
        await favorites.addFavorite(recipe);
        console.log('Recipe added to favorites');
      }
    }

    const relatedRecipes = await api.getRelatedRecipes(recipeId);
    console.log('Related Recipes:');
    console.log(utils.formatRecipeList(relatedRecipes));

  } catch (error) {
    console.error('Error viewing recipe details:', error.message);
  }
}





You said:
remember keep the code simple dont do anything extra


ChatGPT said:
js
Copy
Edit
async function viewRecipeDetails(recipeId) {
  if (!recipeId) {
    recipeId = readlineSync.question('Enter recipe ID: ');
  }

  if (!recipeId.trim()) {
    console.log('Recipe ID cannot be empty');
    return;
  }

  console.log(`Fetching details for recipe ${recipeId}...`);

  try {
    const recipe = await cache.getCachedOrFetch(`recipe_${recipeId}`, () => api.getRecipeById(recipeId));

    if (!recipe) {
      console.log('Recipe not found');
      return;
    }

    console.log(utils.formatRecipe(recipe));
  } catch (error) {
    console.error('Error viewing recipe details:', error.message);
  }
}

/**
 * Explore recipes by first letter
 * Demonstrates using Promise.all
 */
async function exploreByFirstLetter() {
  const letters = readlineSync.question('Enter up to 3 letters to search (e.g. abc): ');

  if (!letters.trim()) {
    console.log('Please enter at least one letter');
    return;
  }

  // Get unique letters (limit to 3 to avoid API abuse)
  const uniqueLetters = Array.from(new Set(letters.toLowerCase())).slice(0, 3);

  console.log(`Searching for recipes starting with: ${uniqueLetters.join(', ')}...`);

  try {
    const recipes = await cache.getCachedOrFetch(`letters_${uniqueLetters.sort().join('')}`, () => api.searchMealsByFirstLetter(uniqueLetters.join(',')));

    if (!recipes || recipes.length === 0) {
      console.log('No recipes found');
      return;
    }

    console.log(utils.formatRecipeList(recipes));

    const viewDetails = readlineSync.keyInYN('Would you like to view details for a recipe?');

    if (viewDetails) {
      const index = readlineSync.questionInt(`Enter recipe number (1-${recipes.length}): `, {
        limit: input => {
          const num = parseInt(input);
          return num >= 1 && num <= recipes.length;
        },
        limitMessage: `Please enter a number between 1 and ${recipes.length}`
      });

      await viewRecipeDetails(recipes[index - 1].idMeal);
    }
  } catch (error) {
    console.error('Error exploring recipes by first letter:', error.message);
  }
}

/**
 * Search recipes by ingredient with timeout
 * Demonstrates using Promise.race for timeout
 */
async function searchByIngredient() {
  const ingredient = readlineSync.question('Enter an ingredient: ');

  if (!ingredient.trim()) {
    console.log('Ingredient cannot be empty');
    return;
  }

  console.log(`Searching for recipes with ${ingredient}...`);

  try {
    const recipes = await cache.getCachedOrFetch(`ingredient_${ingredient.toLowerCase()}`, () => api.getMealsByIngredient(ingredient));

    if (typeof recipes === 'string') {
      console.log(recipes); // Display error message
      return;
    }

    console.log(utils.formatRecipeList(recipes));

    const viewDetails = readlineSync.keyInYN('Would you like to view details for a recipe?');

    if (viewDetails) {
      const index = readlineSync.questionInt(`Enter recipe number (1-${recipes.length}): `, {
        limit: input => {
          const num = parseInt(input);
          return num >= 1 && num <= recipes.length;
        },
        limitMessage: `Please enter a number between 1 and ${recipes.length}`
      });

      await viewRecipeDetails(recipes[index - 1].idMeal);
    }
  } catch (error) {
    console.error('Error searching by ingredient:', error.message);
  }
}

/**
 * View favorite recipes
 */
async function viewFavorites() {
  try {
    // Get favorites
    const favoriteRecipes = await favorites.getFavorites();

    if (favoriteRecipes.length === 0) {
      console.log('You have no favorite recipes');
      return;
    }

    console.log(utils.formatRecipeList(favoriteRecipes));

    // Allow viewing details
    const viewDetails = readlineSync.keyInYN('Would you like to view details for a recipe?');

    if (viewDetails) {
      const index = readlineSync.questionInt(`Enter recipe number (1-${favoriteRecipes.length}): `, {
        limit: input => {
          const num = parseInt(input);
          return num >= 1 && num <= favoriteRecipes.length;
        },
        limitMessage: `Please enter a number between 1 and ${favoriteRecipes.length}`
      });

      // View the selected recipe
      await viewRecipeDetails(favoriteRecipes[index - 1].idMeal);
    }
  } catch (error) {
    console.error('Error viewing favorites:', error.message);
  }
}

/**
 * Discover random recipes
 * Demonstrates Promise.race to get the first of several random recipes
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race | MDN: Promise.race}
 */
async function discoverRandom() {
  console.log('Fetching random recipes...');

  try {
    const randomRecipes = await Promise.race([
      api.getRandomMeal(),
      api.getRandomMeal(),
      api.getRandomMeal()
    ]);

    if (!randomRecipes) {
      console.log('No random recipe found.');
      return;
    }

    console.log(utils.formatRecipe(randomRecipes));

    const isFavorite = await favorites.isFavorite(randomRecipes.idMeal);
    if (isFavorite) {
      const removeFromFavorites = readlineSync.keyInYNStrict('This recipe is in your favorites. Would you like to remove it?');
      if (removeFromFavorites) {
        await favorites.removeFromFavorites(randomRecipes.idMeal);
        console.log('Recipe removed from favorites.');
      }
    } else {
      const addToFavorites = readlineSync.keyInYNStrict('Would you like to add this recipe to favorites?');
      if (addToFavorites) {
        await favorites.addToFavorites(randomRecipes);
        console.log('Recipe added to favorites.');
      }
    }
  } catch (error) {
    console.error('Error discovering random recipes:', error.message);
  }
}

/**
 * Display the main menu and handle user input
 */
async function showMainMenu() {
  console.log('\n===== RECIPE EXPLORER =====');
  console.log('1. Search recipes');
  console.log('2. View recipe details by ID');
  console.log('3. Explore recipes by first letter');
  console.log('4. Search by ingredient');
  console.log('5. View favorites');
  console.log('6. Discover random recipe');
  console.log('7. Exit');

  const choice = readlineSync.questionInt('Enter your choice (1-7): ', {
    limit: [1, 2, 3, 4, 5, 6, 7],
    limitMessage: 'Please enter a number between 1 and 7'
  });

  switch (choice) {
    case 1:
      await searchRecipes();
      break;
    case 2:
      await viewRecipeDetails();
      break;
    case 3:
      await exploreByFirstLetter();
      break;
    case 4:
      await searchByIngredient();
      break;
    case 5:
      await viewFavorites();
      break;
    case 6:
      await discoverRandom();
      break;
    case 7:
      console.log('Thank you for using Recipe Explorer!');
      process.exit(0);
      break;
  }

  // Return to main menu after function completes
  return showMainMenu();
}

/**
 * Main application entry point
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function | MDN: async function}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch | MDN: Promise.catch}
 */
async function main() {
  console.log('Initializing Recipe Explorer...');

  const success = await initialize();
  if (!success) {
    console.error('Initialization failed. Exiting...');
    process.exit(1);
  }

  console.log('Welcome to Recipe Explorer!');
  await showMainMenu();
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default {
  main,
  searchRecipes,
  viewRecipeDetails,
  exploreByFirstLetter,
  searchByIngredient,
  viewFavorites,
  discoverRandom
};