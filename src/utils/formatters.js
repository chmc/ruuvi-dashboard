/**
 * @param {number} temperature
 * @returns {string}
 */
const toTemperatureUI = (temperature) => temperature.toFixed(1)

/**
 * @param {number} humidity
 * @returns {string}
 */
const toHumidityUI = (humidity) => Math.round(humidity).toString()

/**
 * @param {number} pressure
 * @returns {string}
 */
const toPressureUI = (pressure) => Math.round(pressure.toFixed(0)).toString()

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
 * @param {number} wind
 * @returns {string}
 */
const toWindUI = (wind) => wind.toFixed(1)

const uiFormatter = {
  toTemperatureUI,
  toHumidityUI,
  toPressureUI,
  toDayOfWeekUI,
  toWindUI,
}

export default uiFormatter
