/**
 * Normalize MAC address to lowercase for consistent lookups
 * @param {string} mac
 * @returns {string}
 */
const normalizeMac = (mac) => mac?.toLowerCase() || ''

/**
 *  @param {SensorDataCollection} sensorData
 *  @param {SensorDataCollection} cachedSensorData
 *  @param {string[]} macIds
 */
const getSensorData = (sensorData, cachedSensorData, macIds) => {
  // Ensure cachedSensorData defaults to empty object if undefined
  const cached = cachedSensorData || {}

  if (!sensorData) {
    return cached
  }

  // Ensure sensorData is an object
  const current = sensorData || {}

  // Use normalized (lowercase) MAC addresses for consistent lookups
  // since scanner produces lowercase MACs from RuuviTag payload
  return macIds.reduce(
    (updatedSensorData, macId) => {
      const normalizedMac = normalizeMac(macId)
      return {
        ...updatedSensorData,
        [normalizedMac]: current[normalizedMac] || cached[normalizedMac],
      }
    },
    { ...current }
  )
}

module.exports = {
  getSensorData,
}
