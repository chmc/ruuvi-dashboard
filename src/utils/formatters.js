/**
 * @param {number=} temperature
 * @returns {string}
 */
const toTemperatureUI = (temperature) =>
  temperature ? temperature.toFixed(1) : '-'

/**
 * @param {number}= temperature
 * @returns {string}
 */
const toTemperatureRoundUpUI = (temperature) =>
  temperature ? Math.round(temperature).toString() : '-'

/**
 * @param {number=} humidity
 * @returns {string}
 */
const toHumidityUI = (humidity) =>
  humidity ? Math.round(humidity).toString() : '-'

/**
 * @param {number=} pressure
 * @returns {string}
 */
const toPressureUI = (pressure) =>
  pressure ? Math.round(pressure.toFixed(0)).toString() : '-'

/**
 * @typedef {Object} PressureWeatherData
 * @property {string} word - Finnish weather word
 * @property {string} icon - Text icon character
 * @property {string} iconName - Icon identifier for MUI icon mapping
 */

/** @type {PressureWeatherData} */
const WEATHER_STORM = { word: 'Myrsky', icon: '▼', iconName: 'thunderstorm' }
/** @type {PressureWeatherData} */
const WEATHER_RAIN = { word: 'Sade', icon: '↓', iconName: 'rain' }
/** @type {PressureWeatherData} */
const WEATHER_CLOUD = { word: 'Pilvi', icon: '○', iconName: 'cloud' }
/** @type {PressureWeatherData} */
const WEATHER_FAIR = { word: 'Pouta', icon: '↑', iconName: 'partlyCloudy' }
/** @type {PressureWeatherData} */
const WEATHER_SUNNY = { word: 'Aurinko', icon: '★', iconName: 'sunny' }

/**
 * Get structured pressure weather data
 * @param {number=} pressure in hPa
 * @returns {PressureWeatherData | null}
 */
const getPressureWeatherData = (pressure) => {
  if (!pressure) return null
  if (pressure < 990) return WEATHER_STORM
  if (pressure < 1005) return WEATHER_RAIN
  if (pressure < 1015) return WEATHER_CLOUD
  if (pressure < 1025) return WEATHER_FAIR
  return WEATHER_SUNNY
}

/**
 * Convert pressure to Finnish weather word with icon
 * @param {number=} pressure in hPa
 * @returns {string}
 */
const toPressureWeather = (pressure) => {
  const data = getPressureWeatherData(pressure)
  if (!data) return '-'
  return `${data.icon} ${data.word}`
}

/**
 * @param {string} dateString
 * @returns {string}
 */
const toDayOfWeekUI = (dateString) => {
  const date = new Date(dateString)
  const dayOfWeek = date.getDay()
  switch (dayOfWeek) {
    case 0:
      return 'Su'
    case 1:
      return 'Ma'
    case 2:
      return 'Ti'
    case 3:
      return 'Ke'
    case 4:
      return 'To'
    case 5:
      return 'Pe'
    case 6:
      return 'La'
    default:
      return ''
  }
}

/**
 * @param {Date} date
 * @returns {string}
 */
const toShortTimeUI = (date) =>
  `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`

/**
 * @param {number}    hour
 * @returns {string}  In format H:00
 */
const toSharpTimeUI = (hour) => `${hour}:00`

/**
 * @param {number} wind
 * @returns {string}
 */
const toWindUI = (wind) => wind.toFixed(1)

/**
 * @param {number} unixDateTime
 * @returns {string} Format YYYY/MM/DD
 */
const toLocalDate = (unixDateTime) => {
  const date = new Date(unixDateTime * 1000)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date
    .getDate()
    .toString()
    .padStart(2, '0')}`
}

/**
 *
 * @param {number} unixDateTime
 * @returns {number}
 */
const toLocalTime = (unixDateTime) => {
  const date = new Date(unixDateTime * 1000)
  return date.getHours()
}

/**
 * Format timestamp in milliseconds to local date and time string
 * @param {number} timestampMs - Unix timestamp in milliseconds
 * @returns {string} Formatted date/time string (e.g., "24.10.2023, 14:30")
 */
const toLocalDateTime = (timestampMs) => {
  const date = new Date(timestampMs)
  return date.toLocaleString('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const uiFormatter = {
  toTemperatureUI,
  toTemperatureRoundUpUI,
  toHumidityUI,
  toPressureUI,
  toPressureWeather,
  getPressureWeatherData,
  toDayOfWeekUI,
  toWindUI,
  toShortTimeUI,
  toSharpTimeUI,
  toLocalDate,
  toLocalTime,
  toLocalDateTime,
}

export default uiFormatter
