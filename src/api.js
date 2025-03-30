// src/api.js
/**
 * This module contains functions for interacting with TheMealDB API
 * All functions use the built-in fetch API available in Node.js 20+
 */

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

/**
 * Search for meals by name
 * @param {string} query - Search term
 * @returns {Promise<Array>} - Array of meal objects
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/fetch | MDN: fetch API}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | MDN: Promise}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch | MDN: try...catch}
 */
export async function searchMealsByName(query) {
  try {
    const response = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error('Failed to fetch meals by name:', error);
    return [];
  }
}

/**
 * Get detailed information about a specific meal by ID
 * Implementation includes retry logic for resilience
 *
 * @param {string} id - Meal ID
 * @param {number} attempts - Number of retry attempts (default: 2)
 * @returns {Promise<Object|null>} - Meal details or null if not found
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function | MDN: async function}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await | MDN: await}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling | MDN: Error handling}
 */
export async function getMealById(id, attempts = 2) {
  try {
    const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const data = await response.json();
    return data.meals ? data.meals[0] : null;
  } catch (error) {
    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getMealById(id, attempts - 1);
    }
    console.error('Failed to fetch meal by ID:', error);
    return null;
  }
}

/**
 * Search for meals starting with specific letters
 * Uses Promise.all to fetch results for multiple letters in parallel
 *
 * @param {Array<string>} letters - Array of letters to search by
 * @returns {Promise<Array>} - Combined array of meals starting with any of the letters
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all | MDN: Promise.all}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map | MDN: Array.map}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set | MDN: Set}
 */
export async function searchMealsByFirstLetter(letters) {
  try {
    const promises = letters.map(letter =>
      fetch(`${BASE_URL}/search.php?f=${letter}`).then(res =>
        res.ok ? res.json() : Promise.reject(new Error('Failed to fetch'))
      ).then(data => data.meals || []).catch(() => [])
    );
    const results = await Promise.all(promises);
    return [...new Set(results.flat().map(meal => meal.idMeal))].map(id =>
      results.flat().find(meal => meal.idMeal === id)
    );
  } catch (error) {
    console.error('Failed to fetch meals by first letter:', error);
    return [];
  }
}

/**
 * Search for meals containing a specific ingredient
 * Implements a timeout using Promise.race
 *
 * @param {string} ingredient - Ingredient to search for
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Array|string>} - Array of meals or error message if timeout
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race | MDN: Promise.race}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises | MDN: Using promises}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof | MDN: typeof}
 */
export async function getMealsByIngredient(ingredient, timeoutMs = 5000) {
  const fetchMeals = fetch(`${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`)
    .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch')))
    .then(data => data.meals || [])
    .catch(() => []);

  const timeout = new Promise((_, reject) => setTimeout(() => reject('Request timed out'), timeoutMs));

  try {
    return await Promise.race([fetchMeals, timeout]);
  } catch (error) {
    console.error('Failed to fetch meals by ingredient:', error);
    return 'took too long';
  }
}

/**
 * Get related recipes based on a recipe's category
 * Used in promise chaining examples
 *
 * @param {Object} recipe - Recipe object with strCategory property
 * @param {number} limit - Maximum number of related recipes to return
 * @returns {Promise<Array>} - Array of related recipes
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter | MDN: Array.filter}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice | MDN: Array.slice}
 */
export async function getRelatedRecipes(recipe, limit = 3) {
  if (!recipe?.strCategory) return [];
  try {
    const response = await fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(recipe.strCategory)}`);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const data = await response.json();
    return (data.meals || []).filter(meal => meal.idMeal !== recipe.idMeal).slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch related recipes:', error);
    return [];
  }
}

/**
 * Get a random meal from the API
 *
 * @returns {Promise<Object|null>} - Random meal or null if error
 */
export async function getRandomMeal() {
  try {
    const response = await fetch(`${BASE_URL}/random.php`);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const data = await response.json();
    return data.meals ? data.meals[0] : null;
  } catch (error) {
    console.error('Failed to fetch random meal:', error);
    return null;
  }
}

export default {
  searchMealsByName,
  getMealById,
  searchMealsByFirstLetter,
  getMealsByIngredient,
  getRelatedRecipes,
  getRandomMeal
};
