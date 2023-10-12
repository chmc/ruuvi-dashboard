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

const uiFormatter = {
  toTemperatureUI,
  toHumidityUI,
  toPressureUI,
}

export default uiFormatter
