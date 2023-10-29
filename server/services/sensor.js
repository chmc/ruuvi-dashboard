/**
 *  @param {SensorDataCollection} sensorData
 *  @param {SensorDataCollection} cachedSensorData
 */
const getSensorData = (sensorData, cachedSensorData) => {
  if (!sensorData) {
    return cachedSensorData
  }
  const macIds = process.env.REACT_APP_RUUVITAG_MACS?.split(',')
  const updatedSensorData = { ...sensorData }
  macIds.forEach((ruuviTag) => {
    if (!sensorData[ruuviTag]) {
      console.log(
        'data IS UNDF, this is from cache',
        cachedSensorData[ruuviTag]
      )
      updatedSensorData[ruuviTag] = cachedSensorData[ruuviTag]
      console.log('updated object', updatedSensorData)
    } else {
      console.log('data', ruuviTag, sensorData[ruuviTag])
      updatedSensorData[ruuviTag] = sensorData[ruuviTag]
    }
  })
  return updatedSensorData
}

module.exports = {
  getSensorData,
}
