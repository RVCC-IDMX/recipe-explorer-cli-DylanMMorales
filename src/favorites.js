// src/favorites.js
/**
 * This module provides functionality to manage favorite recipes
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAVORITES_FILE = path.join(__dirname, '../data/favorites.json');

/**
 * Initialize favorites file if it doesn't exist
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function | MDN: async function}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch | MDN: try...catch}
 * @see {@link https://nodejs.org/api/fs.html#fs_promises_api | Node.js: fs/promises}
 */
export async function initializeFavorites() {
  try {
    await fs.access(FAVORITES_FILE);
  } catch (error) {
    await fs.mkdir(path.dirname(FAVORITES_FILE), { recursive: true });
    await fs.writeFile(FAVORITES_FILE, JSON.stringify([]));
  }
}

/**
 * Get all favorite recipes
 *
 * @returns {Promise<Array>} - Array of favorite recipes
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse | MDN: JSON.parse}
 */
export async function getFavorites() {
  try {
    await initializeFavorites();
    const data = await fs.readFile(FAVORITES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

/**
 * Add a recipe to favorites
 *
 * @param {Object} recipe - Recipe to add
 * @returns {Promise<boolean>} - True if added successfully
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some | MDN: Array.some}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push | MDN: Array.push}
 */
export async function addFavorite(recipe) {
  try {
    await initializeFavorites();
    const favorites = await getFavorites();

    if (favorites.some(fav => fav.idMeal === recipe.idMeal)) {
      return false;
    }

    favorites.push(recipe);
    await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2), 'utf-8');

    return true;
  } catch (error) {
    console.error("Error adding favorite:", error.message);
    return false;
  }
}

/**
 * Remove a recipe from favorites
 *
 * @param {string} recipeId - ID of recipe to remove
 * @returns {Promise<boolean>} - True if removed successfully
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter | MDN: Array.filter}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify | MDN: JSON.stringify}
 */
export async function removeFavorite(recipeId) {
  try {
    await initializeFavorites();
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter((fav) => fav.idMeal !== recipeId);

    if (favorites.length === updatedFavorites.length) {
      return false;
    }

    await fs.writeFile(FAVORITES_FILE, JSON.stringify(updatedFavorites, null, 2));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a recipe is in favorites
 *
 * @param {string} recipeId - Recipe ID to check
 * @returns {Promise<boolean>} - True if recipe is in favorites
 */
export async function isInFavorites(recipeId) {
  try {
    const favorites = await getFavorites();
    return favorites.some((fav) => fav.idMeal === recipeId);
  } catch (error) {
    return false;
  }
}

/**
 * Get a specific favorite recipe by ID
 *
 * @param {string} recipeId - Recipe ID to get
 * @returns {Promise<Object|null>} - Recipe object or null if not found
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find | MDN: Array.find}
 */
export async function getFavoriteById(recipeId) {
  try {
    const favorites = await getFavorites();
    return favorites.find((fav) => fav.idMeal === recipeId) || null;
  } catch (error) {
    return null;
  }
}

export default {
  initializeFavorites,
  getFavorites,
  addFavorite,
  removeFavorite,
  isInFavorites,
  getFavoriteById
};