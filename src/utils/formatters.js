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
const toDayOfWeek = (dateString) => {
  const date = new Date(dateString)
  const dayOfWeek = date.getDay()
  switch (dayOfWeek) {
    case 0:
      return 'Sun'
    case 1:
      return 'Mon'
    case 2:
      return 'Tue'
    case 3:
      return 'Wed'
    case 4:
      return 'Thu'
    case 5:
      return 'Fri'
    case 6:
      return 'Sat'
    default:
      return ''
  }
}

const uiFormatter = {
  toTemperatureUI,
  toHumidityUI,
  toPressureUI,
  toDayOfWeek,
}

export default uiFormatter
