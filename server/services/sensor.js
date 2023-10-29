/**
 *  @param {SensorDataCollection} sensorData
 *  @param {SensorDataCollection} cachedSensorData
 *  @param {string[]} macIds
 */
const getSensorData = (sensorData, cachedSensorData, macIds) => {
  if (!sensorData) {
    return cachedSensorData
  }

  return macIds.reduce(
    (updatedSensorData, macId) => ({
      ...updatedSensorData,
      [macId]: sensorData[macId] || cachedSensorData[macId],
    }),
    { ...sensorData }
  )
}

module.exports = {
  getSensorData,
}
