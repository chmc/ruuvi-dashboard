/**
 * Graceful Shutdown Handler
 *
 * Registers signal handlers to flush buffer before process exit.
 * Handles SIGTERM (systemd stop) and SIGINT (Ctrl+C) signals.
 *
 * Ensures all buffered sensor readings are persisted before shutdown.
 */

const { createLogger } = require('../../utils/logger')

const log = createLogger('shutdown')

/** @type {(() => any) | null} */
let flushCallback = null

/** @type {(() => void) | null} */
let scannerStopCallback = null

/** @type {boolean} */
let isShuttingDown = false

/** @type {boolean} */
let handlersRegistered = false

/** @type {((signal: string) => Promise<void>) | null} */
let signalHandler = null

/**
 * Trigger the shutdown sequence
 * @param {string} [signal] - The signal that triggered shutdown
 * @returns {Promise<void>}
 */
const triggerShutdown = async (signal = 'manual') => {
  // Prevent multiple shutdown sequences
  if (isShuttingDown) {
    return
  }
  isShuttingDown = true

  log.info({ signal }, 'Graceful shutdown initiated')

  try {
    // Stop scanner first to prevent new readings
    if (scannerStopCallback) {
      log.info('Stopping BLE scanner')
      scannerStopCallback()
    }

    // Flush buffer to database
    if (flushCallback) {
      log.info('Flushing buffer to database')

      // Handle both sync and async callbacks
      const result = await Promise.resolve(flushCallback())

      if (result && typeof result.flushedCount === 'number') {
        log.info({ flushedCount: result.flushedCount }, 'Buffer flushed')
      } else {
        log.info('Buffer flushed successfully')
      }
    }

    log.info('Shutdown complete')
    process.exit(0)
  } catch (error) {
    log.error({ err: error }, 'Shutdown error')
    process.exit(1)
  }
}

/**
 * Create the signal handler function
 * @returns {(signal: string) => Promise<void>}
 */
const createSignalHandler = () => async (signal) => {
  await triggerShutdown(signal)
}

/**
 * Register signal handlers for graceful shutdown
 * @param {() => any} callback - Function to call before exit (typically flushScheduler.forceFlush)
 */
const register = (callback) => {
  if (handlersRegistered) {
    return
  }

  flushCallback = callback
  signalHandler = createSignalHandler()

  process.on('SIGTERM', signalHandler)
  process.on('SIGINT', signalHandler)

  handlersRegistered = true
}

/**
 * Register scanner stop callback for graceful shutdown
 * @param {() => void} callback - Function to stop the BLE scanner
 */
const registerScannerStop = (callback) => {
  scannerStopCallback = callback
}

/**
 * Check if handlers are registered
 * @returns {boolean}
 */
const isRegistered = () => handlersRegistered

/**
 * Reset handler state (for testing)
 */
const reset = () => {
  if (signalHandler) {
    process.removeListener('SIGTERM', signalHandler)
    process.removeListener('SIGINT', signalHandler)
  }

  flushCallback = null
  scannerStopCallback = null
  isShuttingDown = false
  handlersRegistered = false
  signalHandler = null
}

module.exports = {
  register,
  registerScannerStop,
  triggerShutdown,
  isRegistered,
  reset,
}
