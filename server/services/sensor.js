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

  return macIds.reduce(
    (updatedSensorData, macId) => ({
      ...updatedSensorData,
      [macId]: current[macId] || cached[macId],
    }),
    { ...current }
  )
}

module.exports = {
  getSensorData,
}
