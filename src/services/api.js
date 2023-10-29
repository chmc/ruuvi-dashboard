import configs from '../configs'
import formatters from '../utils/formatters'

const fetchRuuviData = async () => {
  const response = await fetch('/api/ruuvi')
  return response.json()
}

const fetchWeatherData = async () => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=60.1695&lon=24.9355&units=metric&appid=${configs.openweatherApiKey}`
  )
  const json = await response.json()
  const weather = json.list
    .filter((item) => item.dt_txt.includes('12:00:00'))
    .map((daily) => ({
      date: daily.dt_txt,
      weekDay: formatters.toDayOfWeekUI(daily.dt_txt),
      temp: daily.main.temp,
      wind: daily.wind.speed,
      iconUrl: `https://openweathermap.org/img/wn/${daily.weather[0].icon}@2x.png`,
    }))
  return weather
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
