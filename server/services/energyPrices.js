/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
const energypricesFromApi = require('./energyPricesFromApi')
const storage = require('../storage')
const dateUtils = require('../utils/date')

/**
 * @param   {EnergyPrices} energyPrices
 * @returns {EnergyPrices}
 */
// eslint-disable-next-line consistent-return
const getEnergyPrices = async (energyPrices) => {
  try {
    const { currentDate, currentDateObject, tomorrowDate, tomorrowDateObject } =
      getTodayAndTomorrowDates()
    console.log('Updated at ', energyPrices?.todayEnergyPrices?.updatedAt)

    if (allowUpdateEnergyPrices(energyPrices, currentDateObject)) {
      console.log('Get new energy prices')
      const dataText = await energypricesFromApi.getEnergyPricesFromApi()
      console.log('energy prices text: ', dataText)
      const allEnergyPrices = JSON.parse(dataText).map((daily) => ({
        date: new Date(daily.DateTime),
        price: Math.round(daily.PriceWithTax * 10000) / 100,
        hour: new Date(daily.DateTime).getHours(),
      }))

      const todayEnergyPrices = allEnergyPrices.filter((energyPrice) =>
        dateUtils.isSameDate(energyPrice.date, currentDateObject)
      )

      const tomorrowEnergyPrices = allEnergyPrices.filter((energyPrice) =>
        dateUtils.isSameDate(energyPrice.date, tomorrowDateObject)
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

      return {
        updatedAt: updatedAppStorage.todayEnergyPrices.updatedAt,
        todayEnergyPrices: updatedAppStorage.todayEnergyPrices,
        tomorrowEnergyPrices: updatedAppStorage.tomorrowEnergyPrices,
      }
    }

    console.log('Use energy prices from cache')
    return {
      updatedAt: energyPrices.todayEnergyPrices.updatedAt,
      todayEnergyPrices: energyPrices.todayEnergyPrices,
      tomorrowEnergyPrices: energyPrices.tomorrowEnergyPrices,
    }
  } catch (error) {
    console.error('getEnergyPrices: ', error)
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
 * @param {EnergyPrices}  energyPrices
 * @param {Date}          currentDateObject
 * @returns {boolean}
 */
const allowUpdateEnergyPrices = (energyPrices, currentDateObject) => {
  try {
    const updatedAt = getUpdatedAtOrMinDate(energyPrices)
    const hoursDifference = calculateHoursDifferenceInDates(updatedAt)
    console.log('Last energy prices updated: ', hoursDifference)

    if (
      isEnergyPricesObjectOrtodayMissing(energyPrices) ||
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
    console.error('allowUpdateEnergyPrices:', error)
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
    hoursDifference > 0.5 &&
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
