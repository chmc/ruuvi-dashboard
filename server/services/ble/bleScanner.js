/**
 * BLE Scanner for RuuviTag devices
 *
 * Provides a wrapper around @abandonware/noble for scanning BLE devices,
 * specifically filtering for RuuviTag sensors.
 */

const EventEmitter = require('events')

// Ruuvi manufacturer ID (little-endian: 0x0499)
const RUUVI_MANUFACTURER_ID = 0x0499

/**
 * Check if manufacturer data is from a RuuviTag
 * @param {Buffer} manufacturerData
 * @returns {boolean}
 */
const isRuuviDevice = (manufacturerData) => {
  if (!manufacturerData || manufacturerData.length < 2) {
    return false
  }
  // Manufacturer ID is stored in little-endian format
  const manufacturerId = manufacturerData.readUInt16LE(0)
  return manufacturerId === RUUVI_MANUFACTURER_ID
}

/**
 * Normalize MAC address to lowercase
 * @param {string} mac
 * @returns {string}
 */
const normalizeMac = (mac) => mac?.toLowerCase() || ''

/**
 * Get MAC address from peripheral (handles different formats)
 * @param {object} peripheral
 * @returns {string}
 */
const getPeripheralMac = (peripheral) => {
  // Some platforms use 'address', others use 'id' without colons
  if (peripheral.address && peripheral.address !== 'unknown') {
    return normalizeMac(peripheral.address)
  }
  // Convert id (no colons) to MAC format
  if (peripheral.id) {
    const id = peripheral.id.toLowerCase()
    if (id.length === 12) {
      return id.match(/.{2}/g).join(':')
    }
    return id
  }
  return ''
}

/**
 * Create a BLE scanner instance
 * @returns {object} Scanner instance with start, stop, on methods
 */
const createScanner = () => {
  const emitter = new EventEmitter()
  let macFilter = []
  let scanning = false
  let noble = null

  /**
   * Handle peripheral discovery
   * @param {object} peripheral
   */
  const handleDiscover = (peripheral) => {
    const manufacturerData = peripheral.advertisement?.manufacturerData
    const mac = getPeripheralMac(peripheral)

    // Only process RuuviTag devices
    if (!isRuuviDevice(manufacturerData)) {
      return
    }

    // Apply MAC filter if set
    if (macFilter.length > 0 && !macFilter.includes(mac)) {
      return
    }

    emitter.emit('discover', peripheral)
  }

  /**
   * Handle BLE state change
   * @param {string} state
   */
  const handleStateChange = (state) => {
    console.log(`BLE state changed: ${state}`)
    if (state === 'poweredOn' && !scanning) {
      // Start scanning for all devices, allow duplicates for continuous updates
      console.log('BLE powered on - starting scan...')
      noble.startScanning([], true)
      scanning = true
      emitter.emit('scanStart')
    } else if (state !== 'poweredOn' && scanning) {
      console.log(`BLE not powered on (${state}) - stopping scan`)
      scanning = false
      emitter.emit('scanStop', { reason: 'stateChange', state })
    }
  }

  return {
    /**
     * Start BLE scanning
     */
    start() {
      // Lazy load noble to allow mocking in tests
      if (!noble) {
        // eslint-disable-next-line global-require
        noble = require('@abandonware/noble')
      }

      console.log(`BLE initial state: ${noble.state}`)
      noble.on('stateChange', handleStateChange)
      noble.on('discover', handleDiscover)

      // If already powered on, start scanning immediately
      if (noble.state === 'poweredOn') {
        console.log('BLE already powered on - starting scan immediately')
        noble.startScanning([], true)
        scanning = true
        emitter.emit('scanStart')
      } else {
        console.log(`Waiting for BLE to power on (current: ${noble.state})...`)
      }
    },

    /**
     * Stop BLE scanning
     */
    stop() {
      if (noble) {
        noble.stopScanning()
        noble.removeListener('stateChange', handleStateChange)
        noble.removeListener('discover', handleDiscover)
      }
      scanning = false
      emitter.emit('scanStop', { reason: 'manual' })
    },

    /**
     * Register event listener
     * @param {string} event - Event name: 'discover', 'scanStart', 'scanStop', 'error'
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
     * Set MAC address filter
     * @param {string[]} macs - Array of MAC addresses to filter by
     */
    setMacFilter(macs) {
      macFilter = macs.map(normalizeMac)
    },

    /**
     * Get current MAC address filter
     * @returns {string[]}
     */
    getMacFilter() {
      return macFilter
    },

    /**
     * Check if scanner is currently scanning
     * @returns {boolean}
     */
    isScanning() {
      return scanning
    },
  }
}

module.exports = {
  createScanner,
  isRuuviDevice,
  normalizeMac,
  getPeripheralMac,
  RUUVI_MANUFACTURER_ID,
}
