/**
 * @file API Response Envelope Helpers
 *
 * Provides standardized response format for all API endpoints.
 *
 * Success response format:
 * {
 *   success: true,
 *   data: <any>
 * }
 *
 * Error response format:
 * {
 *   success: false,
 *   error: {
 *     message: <string>,
 *     code?: <string>,
 *     details?: <any>
 *   }
 * }
 */

/**
 * @typedef {Object} SuccessResponse
 * @property {true} success - Always true for success responses
 * @property {*} data - Response data
 */

/**
 * @typedef {Object} ErrorDetail
 * @property {string} message - Human-readable error message
 * @property {string} [code] - Error code for programmatic handling
 * @property {*} [details] - Additional error details
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {false} success - Always false for error responses
 * @property {ErrorDetail} error - Error information
 */

/**
 * Create a success response envelope
 * @param {*} data - The response data
 * @returns {SuccessResponse}
 */
const success = (data) => ({
  success: true,
  data,
})

/**
 * Create an error response envelope
 * @param {string} message - Human-readable error message
 * @param {string} [code] - Error code for programmatic handling
 * @param {*} [details] - Additional error details
 * @returns {ErrorResponse}
 */
const error = (message, code, details) => {
  const errorObj = { message }

  if (code !== undefined) {
    errorObj.code = code
  }

  if (details !== undefined) {
    errorObj.details = details
  }

  return {
    success: false,
    error: errorObj,
  }
}

/**
 * Create an error response from an exception
 * @param {Error|string|*} err - The error/exception
 * @param {string} [customMessage] - Optional custom message (overrides error message)
 * @param {string} [code] - Optional error code
 * @returns {ErrorResponse}
 */
const errorFromException = (err, customMessage, code) => {
  let message = 'Unknown error'

  if (customMessage) {
    message = customMessage
  } else if (err instanceof Error) {
    message = err.message
  } else if (typeof err === 'string') {
    message = err
  } else if (err && typeof err.message === 'string') {
    message = err.message
  }

  return error(message, code)
}

module.exports = {
  success,
  error,
  errorFromException,
}
