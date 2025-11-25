/**
 * Lightweight logging utility for Express backend
 *
 * Features:
 * - Environment-aware logging levels
 * - Timestamp prefixes
 * - Namespace support for different modules
 * - No external dependencies
 *
 * Usage:
 *   const { createLogger } = require('./utils/logger')
 *   const log = createLogger('server:sse')
 *   log.error('Connection failed', error)
 *   log.warn('High memory usage')
 *   log.info('Server started on port 3001')
 */

/**
 * Check if logging is enabled for the given namespace and level
 * @param {string} namespace - Logger namespace
 * @param {string} level - Log level (error, warn, info, debug)
 * @returns {boolean}
 */
const isEnabled = (namespace, level) => {
  // Always enable errors
  if (level === 'error') return true

  // Check DEBUG environment variable
  const debugEnv = process.env.DEBUG || ''
  const isDev = process.env.NODE_ENV !== 'production'

  if (debugEnv) {
    if (debugEnv === '*') return true
    if (debugEnv === 'server:*') return namespace.startsWith('server:')
    return debugEnv.split(',').some((pattern) => {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
      return regex.test(namespace)
    })
  }

  // Default behavior:
  // - Production: only errors
  // - Development: errors and warnings
  if (level === 'warn') return isDev
  if (level === 'info') return isDev
  if (level === 'debug') return false

  return false
}

/**
 * Format timestamp for log messages
 * @returns {string} Formatted timestamp
 */
const timestamp = () => {
  const now = new Date()
  return now.toISOString()
}

/**
 * Create a namespaced logger
 * @param {string} namespace - Logger namespace (e.g., 'server:sse')
 * @returns {Object} Logger instance with error, warn, info, debug methods
 */
const createLogger = (namespace) => {
  const prefix = `[${namespace}]`

  return {
    /**
     * Log error messages (always enabled)
     * @param {...any} args - Arguments to log
     */
    error: (...args) => {
      if (isEnabled(namespace, 'error')) {
        console.error(`${timestamp()} ${prefix}`, ...args)
      }
    },

    /**
     * Log warning messages (enabled in development)
     * @param {...any} args - Arguments to log
     */
    warn: (...args) => {
      if (isEnabled(namespace, 'warn')) {
        console.warn(`${timestamp()} ${prefix}`, ...args)
      }
    },

    /**
     * Log info messages (enabled in development)
     * @param {...any} args - Arguments to log
     */
    info: (...args) => {
      if (isEnabled(namespace, 'info')) {
        console.info(`${timestamp()} ${prefix}`, ...args)
      }
    },

    /**
     * Log debug messages (disabled by default, enable with DEBUG=*)
     * @param {...any} args - Arguments to log
     */
    debug: (...args) => {
      if (isEnabled(namespace, 'debug')) {
        console.log(`${timestamp()} ${prefix}`, ...args)
      }
    },
  }
}

module.exports = { createLogger }
