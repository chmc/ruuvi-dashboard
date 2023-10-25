/* eslint-disable no-console */
const storage = require('../storage')
const dateUtils = require('../utils/date')

const getEnergyPricesFromApi = async () => {
  try {
    const response = await fetch(`https://api.spot-hinta.fi/TodayAndDayForward`)
    console.log('api called')
    const textData = await response.text()
    return textData
  } catch (error) {
    console.error('getEnergyPricesFromApi: ', error)
    return undefined
  }
}

/**
 * @param {EnergyPrices} energyPrices
 * @returns {boolean}
 */
const allowUpdateEnergyPrices = (energyPrices) => {
  try {
    const currentDateObject = new Date()

    // Calculate the difference in hours
    const updatedAt =
      energyPrices?.todayEnergyPrices?.updatedAt ?? new Date('1900-01-01')
    const timeDifferenceInMilliseconds = new Date() - updatedAt
    const hoursDifference = timeDifferenceInMilliseconds / (1000 * 60 * 60)
    console.log('Last energy prices updated: ', hoursDifference)

    if (!energyPrices.todayEnergyPrices) {
      return true
    }
    if (
      currentDateObject.getHours() > 12 &&
      hoursDifference > 0.5 &&
      !energyPrices.tomorrowEnergyPrices
    ) {
      return true
    }
    if (hoursDifference > 4) {
      return true
    }
    return false
  } catch (error) {
    console.error('allowUpdateEnergyPrices:', error)
    return false
  }
}

/**
 * @param   {EnergyPrices} energyPrices
 * @returns {EnergyPrices}
 */
// eslint-disable-next-line consistent-return
const getEnergyPrices = async (energyPrices) => {
  try {
    const currentDateObject = new Date()
    const currentDate = currentDateObject.toISOString().split('T')[0]
    const tomorrowDateObject = dateUtils.addOneDay()
    const tomorrowDate = tomorrowDateObject.toISOString().split('T')[0]
    console.log('Updated at ', energyPrices?.todayEnergyPrices?.updatedAt)

    if (allowUpdateEnergyPrices(energyPrices)) {
      console.log('Get new energy prices')
      const dataText = await getEnergyPricesFromApi()
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

module.exports = {
  getEnergyPrices,
  getEnergyPricesFromApi,
}
