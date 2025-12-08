/**
 * RuuviTag Scanner Service
 *
 * High-level service that combines BLE scanning with RuuviTag data parsing.
 * Provides an event-based interface for receiving sensor data.
 */

const EventEmitter = require('events')
const bleScanner = require('../ble/bleScanner')
const ruuviParser = require('./ruuviParser')

/**
 * Get MAC address from peripheral or parsed data
 * @param {object} peripheral
 * @param {object} parsedData
 * @returns {string}
 */
const getMacAddress = (peripheral, parsedData) => {
  // Prefer MAC from parsed data (more reliable)
  if (parsedData?.mac) {
    return parsedData.mac.toLowerCase()
  }
  // Fallback to peripheral address
  if (peripheral.address && peripheral.address !== 'unknown') {
    return peripheral.address.toLowerCase()
  }
  // Convert id to MAC format
  if (peripheral.id && peripheral.id.length === 12) {
    return peripheral.id.toLowerCase().match(/.{2}/g).join(':')
  }
  return peripheral.id?.toLowerCase() || ''
}

/**
 * Normalize MAC address to lowercase
 * @param {string} mac
 * @returns {string}
 */
const normalizeMac = (mac) => mac?.toLowerCase() || ''

/**
 * Create a RuuviTag scanner instance
 * @param {object} options
 * @param {string[]} options.macs - MAC addresses to filter by
 * @returns {object} Scanner instance
 */
/**
 * @typedef {Object} SensorHealthData
 * @property {number} lastSeen - Timestamp of last received reading
 * @property {number | null} rssi - Signal strength (dBm), null if not available
 */

/**
 * Create a RuuviTag scanner instance
 * @param {object} options
 * @param {string[]} options.macs - MAC addresses to filter by
 * @returns {object} Scanner instance
 */
const createScanner = (options = {}) => {
  const emitter = new EventEmitter()
  const scanner = bleScanner.createScanner()

  /** @type {SensorDataCollection} */
  let sensorDataCollection = {}

  /** @type {Object.<string, SensorHealthData>} */
  let sensorHealthData = {}

  // Store normalized MAC filter (filtering done after parsing on macOS)
  const macFilter = (options.macs || []).map(normalizeMac).filter(Boolean)

  /**
   * Handle peripheral discovery from BLE scanner
   * @param {object} peripheral
   */
  const handleDiscover = (peripheral) => {
    try {
      const manufacturerData = peripheral.advertisement?.manufacturerData

      // Parse the manufacturer data
      const parsedData = ruuviParser.parse(manufacturerData)

      if (!parsedData) {
        return
      }

      // Convert to SensorData format
      const sensorData = ruuviParser.toSensorData(parsedData)

      if (!sensorData) {
        return
      }

      // Get MAC address (from parsed data - reliable on all platforms)
      const mac = getMacAddress(peripheral, parsedData)

      // Apply MAC filter if set (filter here since macOS doesn't expose real MACs)
      if (macFilter.length > 0 && !macFilter.includes(mac)) {
        return
      }

      // Update collection
      sensorDataCollection[mac] = sensorData

      // Update health data
      sensorHealthData[mac] = {
        lastSeen: Date.now(),
        rssi: typeof peripheral.rssi === 'number' ? peripheral.rssi : null,
      }

      // Emit data event for this sensor
      emitter.emit('data', {
        mac,
        sensorData,
        rawData: parsedData,
        peripheral,
      })

      // Emit collection event with all sensor data
      emitter.emit('collection', { ...sensorDataCollection })
    } catch (error) {
      emitter.emit('error', error)
    }
  }

  return {
    /**
     * Start scanning for RuuviTag sensors
     */
    start() {
      scanner.on('discover', handleDiscover)
      scanner.start()
      emitter.emit('start')
    },

    /**
     * Stop scanning
     */
    stop() {
      scanner.off('discover', handleDiscover)
      scanner.stop()
      emitter.emit('stop')
    },

    /**
     * Register event listener
     * @param {string} event - Event name: 'data', 'collection', 'start', 'stop', 'error'
     * @param {Function} callback
     */
    on(event, callback) {
      emitter.on(event, callback)
    },

    /**
     * Remove event listener
     * @param {string} event
     * @param {Function} callback
     */
    off(event, callback) {
      emitter.off(event, callback)
    },

    /**
     * Get current sensor data collection
     * @returns {SensorDataCollection}
     */
    getSensorData() {
      return { ...sensorDataCollection }
    },

    /**
     * Clear sensor data collection and health data
     */
    clearSensorData() {
      sensorDataCollection = {}
      sensorHealthData = {}
    },

    /**
     * Get sensor health data
     * @returns {Object.<string, SensorHealthData>}
     */
    getSensorHealth() {
      return { ...sensorHealthData }
    },

    /**
     * Check if scanner is running
     * @returns {boolean}
     */
    isScanning() {
      return scanner.isScanning()
    },

    /**
     * Set MAC address filter
     * @param {string[]} macs
     */
    setMacFilter(macs) {
      macFilter.length = 0
      macFilter.push(...macs.map(normalizeMac).filter(Boolean))
    },
  }
}

module.exports = {
  createScanner,
}
