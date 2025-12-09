const cors = require('cors')

/**
 * Get allowed origins from environment variable
 * @returns {string[]} Array of allowed origins
 */
const getAllowedOrigins = () => {
  const originsEnv = process.env.CORS_ALLOWED_ORIGINS
  if (!originsEnv || originsEnv.trim() === '') {
    return []
  }
  return originsEnv.split(',').map((origin) => origin.trim())
}

/**
 * Create CORS middleware with configurable origins
 *
 * By default, only same-origin requests are allowed (no CORS headers).
 * Set CORS_ALLOWED_ORIGINS env var to allow specific cross-origin requests.
 *
 * @returns {import('express').RequestHandler} CORS middleware
 */
const createCorsMiddleware = () => {
  const allowedOrigins = getAllowedOrigins()

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, curl, etc.)
      if (!origin) {
        callback(null, false)
        return
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, origin)
      } else {
        // Origin not allowed - don't set CORS headers
        callback(null, false)
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  })
}

module.exports = createCorsMiddleware
