/**
 * Lightweight logging utility for React frontend
 *
 * Features:
 * - Environment-aware (only logs in development by default)
 * - Can be enabled/disabled via DEBUG environment variable
 * - Provides namespaced loggers for different modules
 * - No external dependencies
 *
 * Usage:
 *   import { createLogger } from './utils/logger'
 *   const log = createLogger('app:polling')
 *   log.error('Polling failed', error)
 *   log.warn('Retry attempt', attempt)
 *   log.info('Connection established')
 */

/**
 * Check if logging is enabled based on environment variables
 * DEBUG=* enables all logs
 * DEBUG=app:* enables all app logs
 * DEBUG=app:polling enables only polling logs
 */
const isEnabled = (namespace) => {
  // Always enable errors
  if (namespace.endsWith(':error')) return true

  // Check environment
  const isDev = process.env.NODE_ENV === 'development'
  const debugEnv = process.env.REACT_APP_DEBUG || ''

  // If DEBUG is set, use it for filtering
  if (debugEnv) {
    if (debugEnv === '*') return true
    if (debugEnv === 'app:*') return namespace.startsWith('app:')
    return debugEnv.split(',').some((pattern) => {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
      return regex.test(namespace)
    })
  }

  // Default: only log errors and warnings in development
  return isDev && (namespace.includes(':error') || namespace.includes(':warn'))
}

/**
 * Create a namespaced logger
 * @param {string} namespace - Logger namespace (e.g., 'app:polling')
 * @returns {Object} Logger instance with error, warn, info, debug methods
 */
export const createLogger = (namespace) => {
  const prefix = `[${namespace}]`

  return {
    /**
     * Log error messages (always enabled)
     * @param {...any} args - Arguments to log
     */
    error: (...args) => {
      if (isEnabled(`${namespace}:error`)) {
        console.error(prefix, ...args)
      }
    },

    /**
     * Log warning messages (enabled in development)
     * @param {...any} args - Arguments to log
     */
    warn: (...args) => {
      if (isEnabled(`${namespace}:warn`)) {
        console.warn(prefix, ...args)
      }
    },

    /**
     * Log info messages (disabled by default)
     * @param {...any} args - Arguments to log
     */
    info: (...args) => {
      if (isEnabled(`${namespace}:info`)) {
        console.info(prefix, ...args)
      }
    },

    /**
     * Log debug messages (disabled by default)
     * @param {...any} args - Arguments to log
     */
    debug: (...args) => {
      if (isEnabled(`${namespace}:debug`)) {
        console.log(prefix, ...args)
      }
    },
  }
}

// Export default logger for general use
export default createLogger('app')
