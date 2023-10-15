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
  const currentDate = new Date().toISOString().split('T')[0]
  const response = await fetch(
    `https://www.sahkohinta-api.fi/api/v1/halpa?tunnit=24&tulos=haja&aikaraja=${currentDate}`
  )
  console.log('api called')
  const textData = await response.text()
  // const json =
  //   '[{"aikaleima_suomi":"2023-10-14T06:00","aikaleima_utc":"2023-10-14T03:00","hinta":"-0.43700"},{"aikaleima_suomi":"2023-10-14T05:00","aikaleima_utc":"2023-10-14T02:00","hinta":"-0.39500"},{"aikaleima_suomi":"2023-10-14T04:00","aikaleima_utc":"2023-10-14T01:00","hinta":"-0.34300"},{"aikaleima_suomi":"2023-10-14T07:00","aikaleima_utc":"2023-10-14T04:00","hinta":"-0.30200"},{"aikaleima_suomi":"2023-10-14T00:00","aikaleima_utc":"2023-10-13T21:00","hinta":"-0.29800"},{"aikaleima_suomi":"2023-10-14T03:00","aikaleima_utc":"2023-10-14T00:00","hinta":"-0.27700"},{"aikaleima_suomi":"2023-10-14T14:00","aikaleima_utc":"2023-10-14T11:00","hinta":"-0.26200"},{"aikaleima_suomi":"2023-10-14T13:00","aikaleima_utc":"2023-10-14T10:00","hinta":"-0.26000"},{"aikaleima_suomi":"2023-10-14T08:00","aikaleima_utc":"2023-10-14T05:00","hinta":"-0.26000"},{"aikaleima_suomi":"2023-10-14T23:00","aikaleima_utc":"2023-10-14T20:00","hinta":"-0.22400"},{"aikaleima_suomi":"2023-10-14T12:00","aikaleima_utc":"2023-10-14T09:00","hinta":"-0.21900"},{"aikaleima_suomi":"2023-10-14T11:00","aikaleima_utc":"2023-10-14T08:00","hinta":"-0.21900"},{"aikaleima_suomi":"2023-10-14T15:00","aikaleima_utc":"2023-10-14T12:00","hinta":"-0.21100"},{"aikaleima_suomi":"2023-10-14T02:00","aikaleima_utc":"2023-10-13T23:00","hinta":"-0.20600"},{"aikaleima_suomi":"2023-10-14T10:00","aikaleima_utc":"2023-10-14T07:00","hinta":"-0.20300"},{"aikaleima_suomi":"2023-10-14T09:00","aikaleima_utc":"2023-10-14T06:00","hinta":"-0.20300"},{"aikaleima_suomi":"2023-10-14T22:00","aikaleima_utc":"2023-10-14T19:00","hinta":"-0.12700"},{"aikaleima_suomi":"2023-10-14T01:00","aikaleima_utc":"2023-10-13T22:00","hinta":"-0.12500"},{"aikaleima_suomi":"2023-10-14T16:00","aikaleima_utc":"2023-10-14T13:00","hinta":"-0.12500"},{"aikaleima_suomi":"2023-10-14T21:00","aikaleima_utc":"2023-10-14T18:00","hinta":"-0.10700"},{"aikaleima_suomi":"2023-10-14T17:00","aikaleima_utc":"2023-10-14T14:00","hinta":"-0.10200"},{"aikaleima_suomi":"2023-10-14T18:00","aikaleima_utc":"2023-10-14T15:00","hinta":"0.00000"},{"aikaleima_suomi":"2023-10-14T20:00","aikaleima_utc":"2023-10-14T17:00","hinta":"0.00000"},{"aikaleima_suomi":"2023-10-14T19:00","aikaleima_utc":"2023-10-14T16:00","hinta":"0.00100"}]'

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
      const data = await getEnergyPricesFromApi()
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
