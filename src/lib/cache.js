/**
 * Client-side caching utility
 * 
 * Caches API responses in localStorage with TTL (Time To Live).
 * Serves cached data on load, fetches fresh in background.
 */

const CACHE_PREFIX = 'app_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data if it exists and hasn't expired
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if expired/missing
 */
export function getCached(key) {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const { data, expiresAt } = JSON.parse(cached);
    
    // Check if expired
    if (Date.now() > expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Error reading cache for ${key}:`, err);
    return null;
  }
}

/**
 * Set cache data with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds (default 5 min)
 */
export function setCached(key, data, ttl = DEFAULT_TTL) {
  try {
    const expiresAt = Date.now() + ttl;
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, expiresAt }));
  } catch (err) {
    console.warn(`Error setting cache for ${key}:`, err);
  }
}

/**
 * Clear specific cache key
 * @param {string} key - Cache key
 */
export function clearCache(key) {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch (err) {
    console.warn(`Error clearing cache for ${key}:`, err);
  }
}

/**
 * Clear all app caches
 */
export function clearAllCaches() {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn('Error clearing all caches:', err);
  }
}

/**
 * Fetch with caching strategy:
 * 1. Return cached data immediately if available
 * 2. Fetch fresh data in background
 * 3. Update cache and component when fresh data arrives
 * 
 * @param {string} cacheKey - Key for caching
 * @param {Function} fetchFn - Async function to fetch data
 * @param {number} ttl - Cache TTL in ms
 * @returns {Promise} Resolves with cached or fresh data
 */
export async function fetchWithCache(cacheKey, fetchFn, ttl = DEFAULT_TTL) {
  // Return cached data immediately if available
  const cached = getCached(cacheKey);
  if (cached) {
    // Fetch fresh in background (fire and forget)
    fetchFn()
      .then(freshData => setCached(cacheKey, freshData, ttl))
      .catch(err => console.warn(`Background fetch failed for ${cacheKey}:`, err));
    
    return cached;
  }

  // No cache, fetch and cache
  const data = await fetchFn();
  setCached(cacheKey, data, ttl);
  return data;
}

export default {
  getCached,
  setCached,
  clearCache,
  clearAllCaches,
  fetchWithCache,
};
