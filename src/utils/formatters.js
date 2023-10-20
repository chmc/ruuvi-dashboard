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
 * @param {number} wind
 * @returns {string}
 */
const toWindUI = (wind) => wind.toFixed(1)

const uiFormatter = {
  toTemperatureUI,
  toTemperatureRoundUpUI,
  toHumidityUI,
  toPressureUI,
  toDayOfWeekUI,
  toWindUI,
  toShortTimeUI,
}

export default uiFormatter
