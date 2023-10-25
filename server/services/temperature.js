/* eslint-disable no-console */
const dateUtils = require('../utils/date')

/**
 * @param {SensorDataCollection} sensorDataCollection
 * @param {TodayMinMaxTemperature} todayMinMaxTemperature
 */
const getTodayMinMaxTemperature = (
  sensorDataCollection,
  todayMinMaxTemperature
) => {
  try {
    console.log('getTodayMinMaxTemperature start')
    if (!sensorDataCollection) {
      console.log(
        'getTodayMinMaxTemperature() sensorDataCollection not available, it is:',
        sensorDataCollection
      )
      return todayMinMaxTemperature
    }

    if (
      !sensorDataCollection[process.env.REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC]
    ) {
      console.log(
        'getTodayMinMaxTemperature() sensorDataCollection for mac: "',
        process.env.REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC,
        '" is missing. Sensor data is:',
        sensorDataCollection
      )
      return todayMinMaxTemperature
    }

    const { temperature } =
      sensorDataCollection[process.env.REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC]

    console.log(
      'getTodayMinMaxTemperature, sensorData temperature: ',
      temperature,
      'todayMinMaxTemperature: ',
      todayMinMaxTemperature
    )

    /** @type {TodayMinMaxTemperature} */
    const minMaxObj = todayMinMaxTemperature ?? {
      date: new Date(),
      minTemperature: temperature,
      maxTemperature: temperature,
    }

    const minMax = dateUtils.isSameDate(minMaxObj.date, new Date())
      ? minMaxObj
      : {
          date: new Date(),
          minTemperature: temperature,
          maxTemperature: temperature,
        }

    const minTemperature =
      temperature < minMax.minTemperature ? temperature : minMax.minTemperature
    const maxTemperature =
      temperature > minMax.maxTemperature ? temperature : minMax.maxTemperature

    console.log(
      'getTodayMinMaxTemperature return min: ',
      minTemperature,
      'max: ',
      maxTemperature
    )

    const ret = { ...minMax, minTemperature, maxTemperature }
    console.log(
      'getTodayMinMaxTemperature original cache: ',
      todayMinMaxTemperature,
      'return object: ',
      ret
    )
    return ret
  } catch (error) {
    console.error('getTodayMinMaxTemperature failed: ', error)
    return todayMinMaxTemperature
  }
}

module.exports = {
  getTodayMinMaxTemperature,
}
