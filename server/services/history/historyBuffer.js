/**
 * In-Memory Buffer Service
 *
 * Accumulates RuuviTag sensor readings in memory before flushing to the database.
 * This reduces the number of disk writes, protecting SD cards from wear.
 *
 * The buffer stores readings as an array and flushes them in batches to the database.
 *
 * Optional tmpfs support allows the buffer to persist to a RAM-based filesystem,
 * enabling recovery after service restarts (but not reboots).
 */

const fs = require('fs')
const path = require('path')
const { createLogger } = require('../../utils/logger')

const log = createLogger('historyBuffer')

/**
 * @typedef {Object} BufferedReading
 * @property {string} mac - MAC address of the sensor (lowercase)
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {number} temperature - Temperature in Celsius
 * @property {number} humidity - Relative humidity percentage
 * @property {number} pressure - Atmospheric pressure in Pascals
 * @property {number} battery - Battery voltage
 */

/**
 * @typedef {Object} BufferConfig
 * @property {boolean} useTmpfs - Whether to persist buffer to tmpfs
 * @property {string|null} tmpfsPath - Path to tmpfs directory
 */

/** @type {BufferedReading[]} */
let buffer = []

/** @type {BufferConfig} */
let config = {
  useTmpfs: false,
  tmpfsPath: null,
}

const BUFFER_FILENAME = 'buffer.json'

/**
 * Get the full path to the buffer file in tmpfs
 * @returns {string|null}
 */
const getBufferFilePath = () => {
  if (!config.useTmpfs || !config.tmpfsPath) {
    return null
  }
  return path.join(config.tmpfsPath, BUFFER_FILENAME)
}

/**
 * Persist the current buffer to tmpfs
 */
const persistToTmpfs = () => {
  const filePath = getBufferFilePath()
  if (!filePath) {
    return
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(buffer), 'utf8')
  } catch (err) {
    // Log error but don't throw - tmpfs persistence is optional
    log.error({ err, filePath }, 'Failed to persist buffer to tmpfs')
  }
}

/**
 * Load buffer from tmpfs file if it exists
 * @returns {BufferedReading[]}
 */
const loadFromTmpfs = () => {
  const filePath = getBufferFilePath()
  if (!filePath) {
    return []
  }

  try {
    if (fs.existsSync(filePath)) {
      const contents = fs.readFileSync(filePath, 'utf8')
      const readings = JSON.parse(contents)
      if (Array.isArray(readings)) {
        return readings
      }
    }
  } catch (err) {
    // Log error but don't throw - corrupted file should not crash the service
    log.error({ err, filePath }, 'Failed to load buffer from tmpfs')
  }

  return []
}

/**
 * Configure the buffer with tmpfs settings
 * @param {Object} options - Configuration options
 * @param {boolean} options.useTmpfs - Whether to use tmpfs persistence
 * @param {string|null} options.tmpfsPath - Path to tmpfs directory
 */
const configure = (options) => {
  const { useTmpfs = false, tmpfsPath = null } = options

  // Validate tmpfs path exists and is a directory
  if (useTmpfs && tmpfsPath) {
    try {
      const stats = fs.statSync(tmpfsPath)
      if (!stats.isDirectory()) {
        log.error({ tmpfsPath }, 'tmpfs path is not a directory')
        config = { useTmpfs: false, tmpfsPath: null }
        return
      }
    } catch (err) {
      log.error(
        { err, tmpfsPath },
        'tmpfs path does not exist or is not accessible'
      )
      config = { useTmpfs: false, tmpfsPath: null }
      return
    }

    config = { useTmpfs: true, tmpfsPath }

    // Load any existing buffer from tmpfs
    const loadedReadings = loadFromTmpfs()
    if (loadedReadings.length > 0) {
      buffer = loadedReadings
    }
  } else {
    config = { useTmpfs: false, tmpfsPath: null }
  }
}

/**
 * Get the current buffer configuration
 * @returns {BufferConfig}
 */
const getConfig = () => ({ ...config })

/**
 * Add a reading to the buffer
 * @param {string} mac - MAC address of the sensor
 * @param {Object} data - Sensor reading data
 * @param {number} data.timestamp - Unix timestamp in milliseconds
 * @param {number} data.temperature - Temperature in Celsius
 * @param {number} data.humidity - Relative humidity percentage
 * @param {number} data.pressure - Atmospheric pressure in Pascals
 * @param {number} data.battery - Battery voltage
 */
const addReading = (mac, data) => {
  buffer.push({
    mac: mac.toLowerCase(),
    timestamp: data.timestamp,
    temperature: data.temperature,
    humidity: data.humidity,
    pressure: data.pressure,
    battery: data.battery,
  })

  // Persist to tmpfs after each addition if enabled
  if (config.useTmpfs) {
    persistToTmpfs()
  }
}

/**
 * Get the number of readings in the buffer
 * @returns {number}
 */
const getBufferSize = () => buffer.length

/**
 * Get all buffered readings
 * @returns {BufferedReading[]}
 */
const getBufferContents = () => [...buffer]

/**
 * Flush all buffered readings to the database
 * @param {Object} historyDb - The history database service
 * @returns {{flushedCount: number}}
 */
const flush = (historyDb) => {
  if (buffer.length === 0) {
    return { flushedCount: 0 }
  }

  const readingsToFlush = [...buffer]
  const result = historyDb.insertBatch(readingsToFlush)

  // Clear buffer after successful flush
  buffer = []

  // Clear tmpfs file after successful flush
  if (config.useTmpfs) {
    persistToTmpfs()
  }

  return { flushedCount: result.totalChanges }
}

/**
 * Clear all buffered readings without flushing to database
 */
const clear = () => {
  buffer = []

  // Clear tmpfs file when buffer is cleared
  if (config.useTmpfs) {
    persistToTmpfs()
  }
}

module.exports = {
  addReading,
  getBufferSize,
  getBufferContents,
  flush,
  clear,
  configure,
  getConfig,
}
