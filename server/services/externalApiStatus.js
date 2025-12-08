/**
 * External API Status Tracking Service
 *
 * Tracks the health status of external APIs (energy prices, OpenWeatherMap)
 * including last successful fetch time and any errors.
 *
 * Uses global object to ensure singleton behavior across all module imports.
 * This is necessary because Node.js module caching can fail in certain cases
 * (case sensitivity, different resolved paths).
 */

/**
 * @typedef {Object} ApiStatusEntry
 * @property {'ok' | 'error' | 'unknown'} status - Current status
 * @property {number | null} lastSuccess - Timestamp of last successful fetch
 * @property {number | null} lastError - Timestamp of last error
 * @property {string | null} errorMessage - Last error message
 */

/**
 * @typedef {Object} ExternalApiStatusData
 * @property {ApiStatusEntry} energyPrices - Energy prices API status
 * @property {ApiStatusEntry} openWeatherMap - OpenWeatherMap API status
 */

/** Valid API names */
const VALID_APIS = ['energyPrices', 'openWeatherMap']

/**
 * Create initial status entry
 * @returns {ApiStatusEntry}
 */
const createInitialEntry = () => ({
  status: 'unknown',
  lastSuccess: null,
  lastError: null,
  errorMessage: null,
})

// Use global object to ensure true singleton behavior
const GLOBAL_KEY = '__externalApiStatus__'

if (!global[GLOBAL_KEY]) {
  global[GLOBAL_KEY] = {
    energyPrices: createInitialEntry(),
    openWeatherMap: createInitialEntry(),
  }
}

/**
 * Internal status storage (reference to global)
 * @type {ExternalApiStatusData}
 */
const apiStatus = global[GLOBAL_KEY]

/**
 * Validate API name
 * @param {string} apiName
 * @throws {Error} If API name is invalid
 */
const validateApiName = (apiName) => {
  if (!VALID_APIS.includes(apiName)) {
    throw new Error(`Unknown API: ${apiName}`)
  }
}

/**
 * Get current status of all external APIs
 * @returns {ExternalApiStatusData}
 */
const getStatus = () => ({
  energyPrices: { ...apiStatus.energyPrices },
  openWeatherMap: { ...apiStatus.openWeatherMap },
})

/**
 * Record a successful API fetch
 * @param {'energyPrices' | 'openWeatherMap'} apiName - API identifier
 */
const recordSuccess = (apiName) => {
  validateApiName(apiName)

  apiStatus[apiName] = {
    ...apiStatus[apiName],
    status: 'ok',
    lastSuccess: Date.now(),
    errorMessage: null,
  }
}

/**
 * Record an API error
 * @param {'energyPrices' | 'openWeatherMap'} apiName - API identifier
 * @param {string} errorMessage - Error description
 */
const recordError = (apiName, errorMessage) => {
  validateApiName(apiName)

  apiStatus[apiName] = {
    ...apiStatus[apiName],
    status: 'error',
    lastError: Date.now(),
    errorMessage,
  }
}

/**
 * Reset all API status to initial state
 * Used for testing
 */
const reset = () => {
  global[GLOBAL_KEY] = {
    energyPrices: createInitialEntry(),
    openWeatherMap: createInitialEntry(),
  }
  // Update local reference
  Object.assign(apiStatus, global[GLOBAL_KEY])
}

module.exports = {
  getStatus,
  recordSuccess,
  recordError,
  reset,
}
