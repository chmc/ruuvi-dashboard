const pino = require('pino')

/**
 * Determine log level based on environment
 * @returns {string} Log level
 */
const getLogLevel = () => {
  if (process.env.NODE_ENV === 'test') {
    return 'silent'
  }
  return process.env.LOG_LEVEL || 'info'
}

/**
 * Configured pino logger instance
 * @type {pino.Logger}
 */
const logger = pino({
  level: getLogLevel(),
  base: {
    pid: undefined, // Remove pid from logs for cleaner output
  },
})

/**
 * Create a child logger with module name
 * @param {string} moduleName - Name of the module for log context
 * @returns {pino.Logger} Child logger instance
 */
const createLogger = (moduleName) =>
  logger.child({
    module: moduleName,
  })

module.exports = logger
module.exports.createLogger = createLogger
