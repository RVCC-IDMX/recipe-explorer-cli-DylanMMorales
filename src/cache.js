// src/cache.js
/**
 * This module provides caching functionality to store API responses locally
 * to reduce API calls and improve performance
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, '../data/cache.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Initialize the cache file if it doesn't exist
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch | MDN: try...catch}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function | MDN: async function}
 * @see {@link https://nodejs.org/api/fs.html#fs_promises_api | Node.js: fs/promises}
 */
export async function initializeCache() {
  try {
    await fs.access(CACHE_FILE);
  } catch (err) {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify({}));
  }
}

/**
 * Get data from cache if it exists and hasn't expired
 *
 * @param {string} key - Cache key
 * @returns {Promise<Object|null>} - Cached data or null if not found or expired
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse | MDN: JSON.parse}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now | MDN: Date.now}
 */
export async function getFromCache(key) {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    const cache = JSON.parse(data);

    if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) {
      return cache[key].data;
    }

    return null;
  } catch (error) {
    return null;
  }
}


/**
 * Save data to cache with a timestamp
 *
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @returns {Promise<boolean>} - True if successfully saved to cache
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify | MDN: JSON.stringify}
 */
export async function saveToCache(key, data) {
  try {
    await initializeCache();

    const cache = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'));

    cache[key] = {
      timestamp: Date.now(),
      data: data,
    };

    await fs.writeFile(CACHE_FILE, JSON.stringify(cache));

    return true;
  } catch {
    return false;
  }
}

/**
 * Clear expired entries from the cache
 *
 * @returns {Promise<number>} - Number of entries removed
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/delete | MDN: delete operator}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in | MDN: for...in}
 */
export async function clearExpiredCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    const cache = JSON.parse(data);

    let removedCount = 0;

    for (const key in cache) {
      if (Date.now() - cache[key].timestamp >= CACHE_DURATION) {
        delete cache[key];
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await fs.writeFile(CACHE_FILE, JSON.stringify(cache));
    }

    return removedCount;
  } catch {
    return 0;
  }
}

/**
 * Get a cached API response or fetch it if not available
 *
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to call if cache miss
 * @param {boolean} forceRefresh - Force a fresh fetch even if cached
 * @returns {Promise<Object>} - Data from cache or fresh fetch
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function | MDN: async function}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises | MDN: Using promises}
 */
export async function getCachedOrFetch(key, fetchFn, forceRefresh = false) {
  let cachedData = null;

  if (!forceRefresh) {
    cachedData = await getFromCache(key);
  }

  if (cachedData) {
    return cachedData;
  }

  const freshData = await fetchFn();
  await saveToCache(key, freshData);

  return freshData;
}

export default {
  initializeCache,
  getFromCache,
  saveToCache,
  clearExpiredCache,
  getCachedOrFetch
};
