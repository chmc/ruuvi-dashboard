/**
 * @typedef {Object} ErrorLogEntry
 * @property {string} id - Unique identifier
 * @property {string} message - Error message
 * @property {number} timestamp - Unix timestamp when error occurred
 * @property {string} [source] - Source of the error (e.g., 'weather', 'sensor')
 */

/**
 * @typedef {function(ErrorLogEntry[]): void} ErrorLogListener
 */

/** @type {number} Maximum number of error entries to keep */
const MAX_ERRORS = 50

/** @type {ErrorLogEntry[]} */
let errors = []

/** @type {Set<ErrorLogListener>} */
const listeners = new Set()

/**
 * Generate a unique ID
 * @returns {string}
 */
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

/**
 * Notify all listeners of changes
 */
const notifyListeners = () => {
  const errorsCopy = [...errors]
  listeners.forEach((listener) => listener(errorsCopy))
}

/**
 * Error log service for storing and managing error messages
 */
const errorLogService = {
  /**
   * Add an error to the log
   * @param {string} message - Error message
   * @param {Object} [options] - Additional options
   * @param {string} [options.source] - Source of the error
   * @returns {ErrorLogEntry} The created error entry
   */
  addError(message, options = {}) {
    const entry = {
      id: generateId(),
      message,
      timestamp: Date.now(),
      source: options.source,
    }

    errors.push(entry)

    // Keep only the last MAX_ERRORS entries
    if (errors.length > MAX_ERRORS) {
      errors = errors.slice(-MAX_ERRORS)
    }

    notifyListeners()
    return entry
  },

  /**
   * Get all errors
   * @returns {ErrorLogEntry[]}
   */
  getErrors() {
    return [...errors]
  },

  /**
   * Remove an error by ID
   * @param {string} id - Error ID to remove
   */
  removeError(id) {
    const index = errors.findIndex((e) => e.id === id)
    if (index !== -1) {
      errors.splice(index, 1)
      notifyListeners()
    }
  },

  /**
   * Clear all errors
   */
  clear() {
    errors = []
    notifyListeners()
  },

  /**
   * Subscribe to error log changes
   * @param {ErrorLogListener} listener - Callback function
   * @returns {function(): void} Unsubscribe function
   */
  subscribe(listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export default errorLogService
