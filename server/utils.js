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
  const response = await fetch(`https://api.spot-hinta.fi/Today`)
  console.log('api called')
  const textData = await response.text()
  return textData
}

/**
 * @param {AppStorage} appStorage
 */
// eslint-disable-next-line consistent-return
const getEnergyPrices = async (appStorage) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0]
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
      const data = JSON.parse(dataText).map((daily) => ({
        date: new Date(daily.DateTime),
        price: Math.round(daily.PriceWithTax * 10000) / 100,
        hour: new Date(daily.DateTime).getHours(),
      }))

      const updatedAppStorage = {
        ...appStorage,
        todayEnergyPrices: {
          updatedAt: new Date(),
          pricesForDate: currentDate,
          data,
        },
      }
      await storage.save(updatedAppStorage)
    } else {
      console.log('Use energy prices from store')
      return appStorage.todayEnergyPrices.data
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
