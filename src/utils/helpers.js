/**
 * @file General helper utilities
 */

/**
 * Generates a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Delays execution for a specified time
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounces a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clones an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }

  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * Checks if two objects are deeply equal
 * @param {*} obj1 - First object
 * @param {*} obj2 - Second object
 * @returns {boolean} Whether objects are equal
 */
export function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Retries a function multiple times with delay
 * @param {Function} fn - Function to retry
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} delayMs - Delay between attempts in milliseconds
 * @returns {Promise<*>} Result of the function
 */
export async function retry(fn, maxAttempts = 3, delayMs = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Chunks an array into smaller arrays of specified size
 * @param {Array} array - Array to chunk
 * @param {number} size - Size of each chunk
 * @returns {Array[]} Array of chunks
 */
export function chunk(array, size) {
  if (!Array.isArray(array) || size < 1) {
    return [];
  }

  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Groups array items by a key function
 * @param {Array} array - Array to group
 * @param {Function} keyFn - Function to generate group key
 * @returns {Object} Grouped object
 */
export function groupBy(array, keyFn) {
  if (!Array.isArray(array)) {
    return {};
  }

  return array.reduce((result, item) => {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {});
}

/**
 * Sorts an array of objects by a property
 * @param {Array} array - Array to sort
 * @param {string} property - Property to sort by
 * @param {boolean} ascending - Sort direction (default: true)
 * @returns {Array} Sorted array
 */
export function sortBy(array, property, ascending = true) {
  if (!Array.isArray(array)) {
    return [];
  }

  const sorted = [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];

    if (aVal < bVal) return ascending ? -1 : 1;
    if (aVal > bVal) return ascending ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Removes duplicate items from an array
 * @param {Array} array - Array to deduplicate
 * @param {Function} [keyFn] - Optional function to generate unique key
 * @returns {Array} Deduplicated array
 */
export function unique(array, keyFn) {
  if (!Array.isArray(array)) {
    return [];
  }

  if (keyFn) {
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  return [...new Set(array)];
}

/**
 * Safely accesses nested object properties
 * @param {Object} obj - Object to access
 * @param {string} path - Dot-separated path (e.g., 'user.address.city')
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} Value at path or default
 */
export function get(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} Whether value is empty
 */
export function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Clamps a number between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
