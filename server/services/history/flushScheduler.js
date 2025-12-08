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

/**
 * @typedef {Object} FlushHistoryEntry
 * @property {number} timestamp - When the flush occurred
 * @property {number} count - Number of records flushed
 * @property {number} durationMs - How long the flush took in milliseconds
 */

/** @type {FlushHistoryEntry[]} */
let flushHistory = []

/** Maximum number of flush history entries to keep */
const MAX_HISTORY_ENTRIES = 5

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
 * Record a flush operation in history
 * @param {number} startTime - When the flush started
 * @param {any} result - Result from the flush callback
 */
const recordFlush = (startTime, result) => {
  const endTime = Date.now()
  const entry = {
    timestamp: endTime,
    count: result?.flushedCount ?? 0,
    durationMs: endTime - startTime,
  }

  flushHistory.push(entry)

  // Keep only the most recent entries
  if (flushHistory.length > MAX_HISTORY_ENTRIES) {
    flushHistory = flushHistory.slice(-MAX_HISTORY_ENTRIES)
  }
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
  flushHistory = []

  intervalId = setInterval(() => {
    if (flushCallback) {
      const startTime = Date.now()
      const result = flushCallback()
      lastFlushTime = Date.now()
      recordFlush(startTime, result)
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
  flushHistory = []
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

  const startTime = Date.now()
  const result = flushCallback()
  lastFlushTime = Date.now()
  recordFlush(startTime, result)
  return result
}

/**
 * Get the timestamp of the last flush
 * @returns {number | null} Unix timestamp in milliseconds, or null if never flushed
 */
const getLastFlushTime = () => lastFlushTime

/**
 * Get the history of recent flush operations
 * @returns {FlushHistoryEntry[]} Array of flush history entries (most recent last)
 */
const getFlushHistory = () => [...flushHistory]

module.exports = {
  start,
  stop,
  isRunning,
  forceFlush,
  getDefaultIntervalMs,
  getLastFlushTime,
  getFlushHistory,
}
