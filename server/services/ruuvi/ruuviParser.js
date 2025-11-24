/**
 * RuuviTag data parser
 *
 * Parses BLE manufacturer data from RuuviTag sensors
 * Supports Data Format 5 (RAWv2)
 */

// Ruuvi manufacturer ID (little-endian: 0x0499)
const RUUVI_MANUFACTURER_ID = 0x0499

// Data format constants
const DATA_FORMAT_5 = 5
const DATA_FORMAT_5_MIN_LENGTH = 26 // 2 (mfr ID) + 1 (format) + 23 (data)

/**
 * Check if manufacturer data is from a RuuviTag
 * @param {Buffer} manufacturerData
 * @returns {boolean}
 */
const isRuuviData = (manufacturerData) => {
  if (!manufacturerData || manufacturerData.length < 3) {
    return false
  }
  const manufacturerId = manufacturerData.readUInt16LE(0)
  return manufacturerId === RUUVI_MANUFACTURER_ID
}

/**
 * Get data format from manufacturer data
 * @param {Buffer} manufacturerData
 * @returns {number|null}
 */
const getDataFormat = (manufacturerData) => {
  if (!manufacturerData || manufacturerData.length < 3) {
    return null
  }
  if (!isRuuviData(manufacturerData)) {
    return null
  }
  return manufacturerData.readUInt8(2)
}

/**
 * Parse signed 16-bit integer from buffer (big-endian)
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {number}
 */
const readInt16BE = (buffer, offset) => {
  const value = buffer.readUInt16BE(offset)
  return value > 32767 ? value - 65536 : value
}

/**
 * Parse Data Format 5 (RAWv2) payload
 *
 * Byte structure (after manufacturer ID):
 * - Byte 0: Data format (5)
 * - Bytes 1-2: Temperature (signed, 0.005°C resolution)
 * - Bytes 3-4: Humidity (unsigned, 0.0025% resolution)
 * - Bytes 5-6: Pressure (unsigned, +50000 Pa)
 * - Bytes 7-8: Acceleration X (signed, mG)
 * - Bytes 9-10: Acceleration Y (signed, mG)
 * - Bytes 11-12: Acceleration Z (signed, mG)
 * - Bytes 13-14: Power info (11 bits battery + 5 bits tx power)
 * - Byte 15: Movement counter
 * - Bytes 16-17: Measurement sequence
 * - Bytes 18-23: MAC address
 *
 * @param {Buffer} data - Buffer starting after manufacturer ID and format byte
 * @returns {object}
 */
const parseDataFormat5 = (data) => {
  // Data starts at byte 3 (after manufacturer ID and format byte)
  // All multi-byte values are big-endian

  // Temperature: signed 16-bit, 0.005°C resolution
  const rawTemp = readInt16BE(data, 3)
  const temperature = rawTemp * 0.005

  // Humidity: unsigned 16-bit, 0.0025% resolution
  const rawHumidity = data.readUInt16BE(5)
  const humidity = rawHumidity * 0.0025

  // Pressure: unsigned 16-bit, add 50000 to get Pa
  const rawPressure = data.readUInt16BE(7)
  const pressure = rawPressure + 50000

  // Acceleration: signed 16-bit, mG
  const accelerationX = readInt16BE(data, 9)
  const accelerationY = readInt16BE(data, 11)
  const accelerationZ = readInt16BE(data, 13)

  // Power info: 11 bits battery voltage + 5 bits tx power
  const powerInfo = data.readUInt16BE(15)
  const batteryRaw = (powerInfo >> 5) & 0x7ff // Top 11 bits
  const txPowerRaw = powerInfo & 0x1f // Bottom 5 bits
  const batteryVoltage = batteryRaw + 1600 // Add 1600mV offset
  const txPower = txPowerRaw * 2 - 40 // Convert to dBm

  // Movement counter
  const movementCounter = data.readUInt8(17)

  // Measurement sequence
  const measurementSequence = data.readUInt16BE(18)

  // MAC address (6 bytes)
  const macBytes = data.slice(20, 26)
  const mac = Array.from(macBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':')

  return {
    dataFormat: DATA_FORMAT_5,
    temperature,
    humidity,
    pressure,
    accelerationX,
    accelerationY,
    accelerationZ,
    batteryVoltage,
    txPower,
    movementCounter,
    measurementSequence,
    mac,
  }
}

/**
 * Parse RuuviTag manufacturer data
 * @param {Buffer} manufacturerData
 * @returns {object|null} Parsed data or null if invalid
 */
const parse = (manufacturerData) => {
  if (!manufacturerData) {
    return null
  }

  if (!isRuuviData(manufacturerData)) {
    return null
  }

  const dataFormat = getDataFormat(manufacturerData)

  if (dataFormat === DATA_FORMAT_5) {
    if (manufacturerData.length < DATA_FORMAT_5_MIN_LENGTH) {
      return null
    }
    return parseDataFormat5(manufacturerData)
  }

  // Unsupported data format
  return null
}

/**
 * Convert parsed RuuviTag data to SensorData format
 * (matches existing application data structure)
 * @param {object} parsedData
 * @returns {SensorData|null}
 */
const toSensorData = (parsedData) => {
  if (!parsedData) {
    return null
  }

  return {
    data_format: parsedData.dataFormat,
    humidity: parsedData.humidity,
    temperature: parsedData.temperature,
    pressure: parsedData.pressure,
    mac: parsedData.mac,
  }
}

module.exports = {
  parse,
  toSensorData,
  getDataFormat,
  isRuuviData,
  RUUVI_MANUFACTURER_ID,
  DATA_FORMAT_5,
}
