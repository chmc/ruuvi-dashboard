/* eslint-disable no-use-before-define */
const { createLogger } = require('../utils/logger')
const energypricesFromApi = require('./energyPricesFromApi')
const storage = require('../storage')
const dateUtils = require('../utils/date')
const externalApiStatus = require('./externalApiStatus')

const log = createLogger('energyPrices')

/**
 * @param   {EnergyPrices} energyPrices
 * @returns {EnergyPrices}
 */
const getEnergyPrices = async (energyPrices) => {
  try {
    const { currentDate, currentDateObject, tomorrowDate, tomorrowDateObject } =
      getTodayAndTomorrowDates()
    log.debug(
      { updatedAt: energyPrices?.todayEnergyPrices?.updatedAt },
      'Checking energy prices'
    )

    if (allowUpdateEnergyPrices(energyPrices, currentDateObject)) {
      log.info('Fetching new energy prices from API')
      const dataText = await energypricesFromApi.getEnergyPricesFromApi()
      log.debug(
        { responseLength: dataText?.length },
        'Energy prices API response received'
      )
      const allEnergyPrices = JSON.parse(dataText).map((daily) => ({
        date: new Date(daily.DateTime),
        price: Math.round(daily.PriceWithTax * 10000) / 100,
        hour: new Date(daily.DateTime).getHours(),
      }))

      log.debug(
        {
          totalPrices: allEnergyPrices.length,
          firstPrice: allEnergyPrices[0],
          lastPrice: allEnergyPrices[allEnergyPrices.length - 1],
        },
        'Energy prices parsed'
      )

      const todayEnergyPrices = allEnergyPrices.filter((energyPrice) =>
        dateUtils.isSameDate(energyPrice.date, currentDateObject)
      )

      const tomorrowEnergyPrices = allEnergyPrices.filter((energyPrice) =>
        dateUtils.isSameDate(energyPrice.date, tomorrowDateObject)
      )

      log.debug(
        {
          todayCount: todayEnergyPrices.length,
          tomorrowCount: tomorrowEnergyPrices.length,
        },
        'Energy prices filtered'
      )

      const appStorage = await storage.loadOrDefault()
      const updatedAppStorage = {
        ...appStorage,
        todayEnergyPrices: {
          updatedAt: new Date(),
          pricesForDate: currentDate,
          data: todayEnergyPrices,
        },
        tomorrowEnergyPrices:
          tomorrowEnergyPrices.length === 0
            ? undefined
            : {
                updatedAt: new Date(),
                pricesForDate: tomorrowDate,
                data: tomorrowEnergyPrices,
              },
      }
      await storage.save(updatedAppStorage)

      // Record successful API call
      externalApiStatus.recordSuccess('energyPrices')

      return {
        updatedAt: updatedAppStorage.todayEnergyPrices.updatedAt,
        todayEnergyPrices: updatedAppStorage.todayEnergyPrices,
        tomorrowEnergyPrices: updatedAppStorage.tomorrowEnergyPrices,
      }
    }

    log.debug('Using energy prices from cache')

    // Record success since we have valid cached data (API worked previously)
    externalApiStatus.recordSuccess('energyPrices')

    return {
      updatedAt: energyPrices.todayEnergyPrices.updatedAt,
      todayEnergyPrices: energyPrices.todayEnergyPrices,
      tomorrowEnergyPrices: energyPrices.tomorrowEnergyPrices,
    }
  } catch (error) {
    log.error({ err: error }, 'getEnergyPrices failed')
    // Record API error
    externalApiStatus.recordError(
      'energyPrices',
      error.message || 'Unknown error'
    )
    return undefined
  }
}

/**
 * @returns {EnergyPriceDates}
 */
const getTodayAndTomorrowDates = () => {
  const currentDateObject = new Date()
  const currentDate = currentDateObject.toISOString().split('T')[0]
  const tomorrowDateObject = dateUtils.addOneDay()
  const tomorrowDate = tomorrowDateObject.toISOString().split('T')[0]
  return { currentDateObject, currentDate, tomorrowDateObject, tomorrowDate }
}

/**
 * Check if stored today's prices are for the wrong date (e.g., after midnight rollover)
 * @param {EnergyPrices} energyPrices
 * @param {string} currentDate - Format YYYY-MM-DD
 * @returns {boolean}
 */
const isTodayPricesForWrongDate = (energyPrices, currentDate) => {
  if (!energyPrices?.todayEnergyPrices?.pricesForDate) {
    return false // No prices to check, will be caught by other conditions
  }
  const isWrongDate =
    energyPrices.todayEnergyPrices.pricesForDate !== currentDate
  if (isWrongDate) {
    log.debug(
      {
        storedDate: energyPrices.todayEnergyPrices.pricesForDate,
        currentDate,
      },
      'Today prices are for wrong date (midnight rollover detected)'
    )
  }
  return isWrongDate
}

/**
 * @param {EnergyPrices}  energyPrices
 * @param {Date}          currentDateObject
 * @returns {boolean}
 */
const allowUpdateEnergyPrices = (energyPrices, currentDateObject) => {
  try {
    const currentDate = currentDateObject.toISOString().split('T')[0]
    const updatedAt = getUpdatedAtOrMinDate(energyPrices)
    const hoursDifference = calculateHoursDifferenceInDates(updatedAt)
    log.debug({ hoursDifference }, 'Time since last energy prices update')

    if (
      isEnergyPricesObjectOrtodayMissing(energyPrices) ||
      isTodayPricesForWrongDate(energyPrices, currentDate) ||
      isCloseToTomorrowPrices(
        energyPrices,
        currentDateObject,
        hoursDifference
      ) ||
      isCurrentPricesTooOld(hoursDifference)
    ) {
      return true
    }
    return false
  } catch (error) {
    log.error({ err: error }, 'allowUpdateEnergyPrices failed')
    return false
  }
}

/**
 * @param {EnergyPrices=} energyPrices
 * @returns {Date}
 */
const getUpdatedAtOrMinDate = (energyPrices) =>
  energyPrices?.todayEnergyPrices?.updatedAt ?? new Date('1900-01-01')

/**
 * @param {Date} updatedAt
 * @returns {number}
 */
const calculateHoursDifferenceInDates = (updatedAt) => {
  const timeDifferenceInMilliseconds = new Date() - updatedAt
  const hoursDifference = timeDifferenceInMilliseconds / (1000 * 60 * 60)
  return hoursDifference
}

/**
 *
 * @param {EnergyPrices} energyPrices
 * @returns {boolean}
 */
const isEnergyPricesObjectOrtodayMissing = (energyPrices) => {
  if (!energyPrices || !energyPrices.todayEnergyPrices) {
    return true
  }
  return false
}

/**
 * @param {EnergyPrices} energyPrices
 * @param {Date} currentDateObject
 * @param {number} hoursDifference
 * @returns {boolean}
 */
const isCloseToTomorrowPrices = (
  energyPrices,
  currentDateObject,
  hoursDifference
) => {
  if (
    currentDateObject.getHours() > 12 &&
    hoursDifference >= 0.5 &&
    !energyPrices.tomorrowEnergyPrices
  ) {
    return true
  }
  return false
}

/**
 * @param {number} hoursDifference
 * @returns {boolean}
 */
const isCurrentPricesTooOld = (hoursDifference) => hoursDifference > 4

module.exports = {
  getEnergyPrices,
}
