/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
const dateUtils = require('../utils/date')

/**
 * Normalize MAC address to lowercase for consistent lookups
 * @param {string} mac
 * @returns {string}
 */
const normalizeMac = (mac) => mac?.toLowerCase() || ''

/**
 * @param {SensorDataCollection} sensorDataCollection
 * @param {TodayMinMaxTemperature} todayMinMaxTemperature
 */
const getTodayMinMaxTemperature = (
  sensorDataCollection,
  todayMinMaxTemperature
) => {
  try {
    // Normalize MAC to lowercase for consistent lookups
    const mainOutdoorRuuviTagMac = normalizeMac(
      process.env.REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC
    )

    if (isSensorDataMissing(sensorDataCollection)) {
      return todayMinMaxTemperature
    }

    if (
      isSensorDataMissingForMac(sensorDataCollection, mainOutdoorRuuviTagMac)
    ) {
      return todayMinMaxTemperature
    }

    const { temperature } = sensorDataCollection[mainOutdoorRuuviTagMac]

    const minMaxObj = getNewObjectIfTodayMinMaxIsMissing(
      todayMinMaxTemperature,
      temperature
    )

    const minMax = resetMinMaxIfDateIsDifferent(minMaxObj, temperature)

    const { minTemperature, maxTemperature } = getNewMinAndMaxTemperatures(
      minMax,
      temperature
    )

    const ret = { ...minMax, minTemperature, maxTemperature }
    return ret
  } catch (error) {
    console.error('getTodayMinMaxTemperature failed: ', error)
    return todayMinMaxTemperature
  }
}

/**
 * @param {SensorDataCollection} sensorDataCollection
 */
const isSensorDataMissing = (sensorDataCollection) => !sensorDataCollection

/**
 * @param {SensorDataCollection} sensorDataCollection
 * @param {string} sensorMac
 */
const isSensorDataMissingForMac = (sensorDataCollection, sensorMac) =>
  !sensorDataCollection[sensorMac]

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
