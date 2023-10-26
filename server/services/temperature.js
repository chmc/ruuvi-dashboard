/* eslint-disable no-use-before-define */
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
    const mainOutdoorRuuviTagMac =
      process.env.REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC

    if (isSensorDataMissing(sensorDataCollection)) {
      return todayMinMaxTemperature
    }

    if (
      isSensorDataMissingForMac(sensorDataCollection, mainOutdoorRuuviTagMac)
    ) {
      return todayMinMaxTemperature
    }

    const { temperature } = sensorDataCollection[mainOutdoorRuuviTagMac]

    console.log(
      'getTodayMinMaxTemperature, sensorData temperature: ',
      temperature,
      'todayMinMaxTemperature: ',
      todayMinMaxTemperature
    )

    const minMaxObj = getNewObjectIfTodayMinMaxIsMissing(
      todayMinMaxTemperature,
      temperature
    )

    const minMax = resetMinMaxIfDateIsDifferent(minMaxObj, temperature)

    const { minTemperature, maxTemperature } = getNewMinAndMaxTemperatures(
      minMax,
      temperature
    )

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

/**
 * @param {SensorDataCollection} sensorDataCollection
 */
const isSensorDataMissing = (sensorDataCollection) => {
  if (!sensorDataCollection) {
    console.log(
      'getTodayMinMaxTemperature() sensorDataCollection not available, it is:',
      sensorDataCollection
    )
    return true
  }
  return false
}

/**
 * @param {SensorDataCollection} sensorDataCollection
 * @param {string} sensorMac
 */
const isSensorDataMissingForMac = (sensorDataCollection, sensorMac) => {
  if (!sensorDataCollection[sensorMac]) {
    console.log(
      'getTodayMinMaxTemperature() sensorDataCollection for mac: "',
      process.env.REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC,
      '" is missing. Sensor data is:',
      sensorDataCollection
    )
    return true
  }
  return false
}

/**
 * @param {TodayMinMaxTemperature} todayMinMaxTemperature
 * @param {number} temperature
 */
const getNewObjectIfTodayMinMaxIsMissing = (
  todayMinMaxTemperature,
  temperature
) =>
  todayMinMaxTemperature ?? {
    date: new Date(),
    minTemperature: temperature,
    maxTemperature: temperature,
  }

/**
 * @param {TodayMinMaxTemperature} todayMinMaxTemperature
 * @param {number} temperature
 */
const resetMinMaxIfDateIsDifferent = (todayMinMaxTemperature, temperature) =>
  dateUtils.isSameDate(todayMinMaxTemperature.date, new Date())
    ? todayMinMaxTemperature
    : {
        date: new Date(),
        minTemperature: temperature,
        maxTemperature: temperature,
      }

/**
 * @param {TodayMinMaxTemperature} todayMinMaxTemperature
 * @param {number} temperature
 */
const getNewMinAndMaxTemperatures = (todayMinMaxTemperature, temperature) => {
  const minTemperature =
    temperature < todayMinMaxTemperature.minTemperature
      ? temperature
      : todayMinMaxTemperature.minTemperature
  const maxTemperature =
    temperature > todayMinMaxTemperature.maxTemperature
      ? temperature
      : todayMinMaxTemperature.maxTemperature

  return {
    minTemperature,
    maxTemperature,
  }
}

module.exports = {
  getTodayMinMaxTemperature,
}
