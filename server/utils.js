const storage = require('./storage')

// Wave height and frequency
const amplitude = 0.5
const frequency = 0.1

const initSimulator = () => ({
  mac1: {
    data_format: 5,
    humidity: 42.0,
    temperature: 22.37,
    pressure: 1013.07,
  },
  mac2: {
    data_format: 5,
    humidity: 73.17,
    temperature: 7.37,
    pressure: 1015.3,
  },
  mac3: {
    data_format: 5,
    humidity: 42.9,
    temperature: 24.42,
    pressure: 1013.58,
  },
})

const modifyDataWithWave = (jsonData) => {
  const currentTime = new Date().getTime()
  const macs = Object.keys(jsonData)
  macs.forEach((mac) => {
    const data = jsonData[mac]
    data.humidity += amplitude * Math.sin(frequency * currentTime)
    data.temperature += amplitude * Math.sin(frequency * currentTime)
    data.pressure += amplitude * Math.sin(frequency * currentTime)
  })

  return jsonData
}

const getEnergyPricesFromApi = async () => {
  const response = await fetch(`https://api.spot-hinta.fi/TodayAndDayForward`)
  console.log('api called')
  const textData = await response.text()
  return textData
}

/**
 *
 * @param {Date} [new Date()] date  Defaults to current date
 * @returns {Date}
 */
const addOneDay = (date = new Date()) => {
  date.setDate(date.getDate() + 1)
  return date
}

/**
 * @param {Date=} date1
 * @param {Date=} date2
 * @returns
 */
const isSameDate = (date1, date2) =>
  date1?.getFullYear() === date2?.getFullYear() &&
  date1?.getMonth() === date2?.getMonth() &&
  date1?.getDate() === date2?.getDate()

/**
 * @param {AppStorage} appStorage
 */
// eslint-disable-next-line consistent-return
const getEnergyPrices = async (appStorage) => {
  try {
    const currentDateObject = new Date()
    const currentDate = currentDateObject.toISOString().split('T')[0]
    const tomorrowDateObject = addOneDay()
    const tomorrowDate = tomorrowDateObject.toISOString().split('T')[0]
    const updatedAt = new Date(appStorage.todayEnergyPrices.updatedAt)
    console.log(
      'Updated at ',
      appStorage.todayEnergyPrices.updatedAt,
      updatedAt,
      new Date()
    )

    // Calculate the difference in hours
    const timeDifferenceInMilliseconds = new Date() - updatedAt
    const hoursDifference = timeDifferenceInMilliseconds / (1000 * 60 * 60)
    console.log('Last energy prices updated: ', hoursDifference, 'h ago')

    if (hoursDifference > 4) {
      console.log('Get new energy prices')
      const dataText = await getEnergyPricesFromApi()
      const allEnergyPrices = JSON.parse(dataText).map((daily) => ({
        date: new Date(daily.DateTime),
        price: Math.round(daily.PriceWithTax * 10000) / 100,
        hour: new Date(daily.DateTime).getHours(),
      }))

      const todayEnergyPrices = allEnergyPrices.filter((energyPrice) =>
        isSameDate(energyPrice.date, currentDateObject)
      )

      const tomorrowEnergyPrices = allEnergyPrices.filter((energyPrice) =>
        isSameDate(energyPrice.date, tomorrowDateObject)
      )

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
    } else {
      console.log('Use energy prices from store')
      return {
        todayEnergyPrices: appStorage.todayEnergyPrices.data,
        tomorrowEnergyPrices: appStorage.tomorrowEnergyPrices?.data,
      }
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

module.exports = {
  initSimulator,
  modifyDataWithWave,
  getEnergyPrices,
  getEnergyPricesFromApi,
}
