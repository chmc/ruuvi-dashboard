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

const uiFormatter = {
  toTemperatureUI,
  toTemperatureRoundUpUI,
  toHumidityUI,
  toPressureUI,
  toDayOfWeekUI,
  toWindUI,
  toShortTimeUI,
  toSharpTimeUI,
  toLocalDate,
  toLocalTime,
}

export default uiFormatter
