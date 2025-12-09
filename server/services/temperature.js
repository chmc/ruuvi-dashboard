/* eslint-disable no-use-before-define */
const { createLogger } = require('../utils/logger')
const dateUtils = require('../utils/date')

const log = createLogger('temperature')

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
    log.debug('getTodayMinMaxTemperature start')
    // Normalize MAC to lowercase for consistent lookups
    const mainOutdoorRuuviTagMac = normalizeMac(
      process.env.VITE_MAIN_OUTDOOR_RUUVITAG_MAC
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

    log.debug(
      {
        temperature,
        currentMinMax: todayMinMaxTemperature,
      },
      'Processing temperature reading'
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

    log.debug(
      { minTemperature, maxTemperature },
      'Updated min/max temperatures'
    )

    const ret = { ...minMax, minTemperature, maxTemperature }
    return ret
  } catch (error) {
    log.error({ err: error }, 'getTodayMinMaxTemperature failed')
    return todayMinMaxTemperature
  }
}

/**
 * @param {SensorDataCollection} sensorDataCollection
 */
const isSensorDataMissing = (sensorDataCollection) => {
  if (!sensorDataCollection) {
    log.debug('sensorDataCollection not available')
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
    log.debug({ mac: sensorMac }, 'Sensor data missing for MAC')
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
