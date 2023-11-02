import configs from '../configs'
import formatters from '../utils/formatters'

const fetchRuuviData = async () => {
  const response = await fetch('/api/ruuvi')
  return response.json()
}

/**
 * @returns {WeatherForecast}
 */
const fetchWeatherData = async () => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=60.1695&lon=24.9355&units=metric&appid=${configs.openweatherApiKey}`
  )
  /** @type {WeatherData} */
  const json = await response.json()

  /** @type {Weather[]} */
  const allWeathers = json.list.map((daily) => ({
    dateTimeUtcTxt: daily.dt_txt,
    dateTxt: formatters.toLocalDate(daily.dt),
    time: formatters.toLocalTime(daily.dt),
    weekDay: formatters.toDayOfWeekUI(daily.dt_txt),
    temp: daily.main.temp,
    wind: daily.wind.speed,
    iconUrl: `https://openweathermap.org/img/wn/${daily.weather[0].icon}@2x.png`,
  }))

  const dailyForecast = allWeathers.filter(
    (item) => item.time > 10 && item.time < 13
  )

  const officeHours = allWeathers.filter(
    (item) => item.time > 6 && item.time < 19
  )
  const hourlyForecast = officeHours.slice(0, 4)

  /** @type {WeatherForecast} */
  const forecast = {
    dailyForecast,
    hourlyForecast,
  }
  console.log(forecast)

  return forecast
}

const fetchEnergyPrices = async () => {
  const response = await fetch('/api/energyprices')
  const text = await response.text()
  const json = JSON.parse(text)
  console.log('energy: ', json)
  return json
}

const fetchMinMaxTemperatures = async () => {
  const response = await fetch('/api/todayminmaxtemperature')
  const text = await response.text()
  const json = JSON.parse(text)
  console.log('minmax: ', json)
  return json
}

const apiService = {
  fetchRuuviData,
  fetchWeatherData,
  fetchEnergyPrices,
  fetchMinMaxTemperatures,
}

export default apiService
