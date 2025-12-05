/**
 * Flush Scheduler Service
 *
 * Manages automatic buffer flushing at configured intervals.
 * Reduces SD card wear by batching writes to the database.
 *
 * Default interval is 15 minutes, configurable via RUUVI_BUFFER_FLUSH_INTERVAL env var.
 */

/** @type {NodeJS.Timeout | null} */
let intervalId = null

/** @type {(() => any) | null} */
let flushCallback = null

/** @type {number | null} */
let lastFlushTime = null

/** Default flush interval in seconds */
const DEFAULT_INTERVAL_SECONDS = 900 // 15 minutes

/**
 * Get the default flush interval in milliseconds from environment variable
 * @returns {number} Interval in milliseconds
 */
const getDefaultIntervalMs = () => {
  const envValue = process.env.RUUVI_BUFFER_FLUSH_INTERVAL

  if (!envValue) {
    return DEFAULT_INTERVAL_SECONDS * 1000
  }

  const seconds = parseInt(envValue, 10)

  if (Number.isNaN(seconds) || seconds <= 0) {
    return DEFAULT_INTERVAL_SECONDS * 1000
  }

  return seconds * 1000
}

/**
 * Start the flush scheduler
 * @param {number} intervalMs - Interval in milliseconds between flushes
 * @param {() => any} callback - Function to call on each flush
 */
const start = (intervalMs, callback) => {
  if (intervalId !== null) {
    // Already running, don't start again
    return
  }

  flushCallback = callback
  lastFlushTime = null

  intervalId = setInterval(() => {
    if (flushCallback) {
      flushCallback()
      lastFlushTime = Date.now()
    }
  }, intervalMs)
}

/**
 * Stop the flush scheduler
 */
const stop = () => {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
  flushCallback = null
  lastFlushTime = null
}

/**
 * Check if scheduler is running
 * @returns {boolean}
 */
const isRunning = () => intervalId !== null

/**
 * Force an immediate flush (for diagnostics or graceful shutdown)
 * @returns {any | null} Result from flush callback, or null if not running
 */
const forceFlush = () => {
  if (!flushCallback) {
    return null
  }

  const result = flushCallback()
  lastFlushTime = Date.now()
  return result
}

/**
 * Get the timestamp of the last flush
 * @returns {number | null} Unix timestamp in milliseconds, or null if never flushed
 */
const getLastFlushTime = () => lastFlushTime

module.exports = {
  start,
  stop,
  isRunning,
  forceFlush,
  getDefaultIntervalMs,
  getLastFlushTime,
}
