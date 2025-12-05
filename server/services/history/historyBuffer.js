/**
 * In-Memory Buffer Service
 *
 * Accumulates RuuviTag sensor readings in memory before flushing to the database.
 * This reduces the number of disk writes, protecting SD cards from wear.
 *
 * The buffer stores readings as an array and flushes them in batches to the database.
 */

/**
 * @typedef {Object} BufferedReading
 * @property {string} mac - MAC address of the sensor (lowercase)
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {number} temperature - Temperature in Celsius
 * @property {number} humidity - Relative humidity percentage
 * @property {number} pressure - Atmospheric pressure in Pascals
 * @property {number} battery - Battery voltage
 */

/** @type {BufferedReading[]} */
let buffer = []

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

  return { flushedCount: result.totalChanges }
}

/**
 * Clear all buffered readings without flushing to database
 */
const clear = () => {
  buffer = []
}

module.exports = {
  addReading,
  getBufferSize,
  getBufferContents,
  flush,
  clear,
}
