/**
 *  @param {SensorDataCollection} sensorData
 *  @param {SensorDataCollection} cachedSensorData
 */
const getSensorData = (sensorData, cachedSensorData) => {
  if (!sensorData) {
    return cachedSensorData
  }

  const macIds = process.env.REACT_APP_RUUVITAG_MACS?.split(',')

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
