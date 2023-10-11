/**
 * @param {number} temperature 
 * @returns {string}
 */
const toTemperatureUI = (temperature) => {
    return temperature.toFixed(1)
}

/**
 * @param {number} humidity 
 * @returns {string}
 */
const toHumidityUI = (humidity) => {
    return Math.round(humidity).toString()
}

/**
 * @param {number} pressure 
 * @returns {string}
 */
const toPressureUI = (pressure) => {
    return Math.round(pressure.toFixed(0)).toString()
}

const uiFormatter = {
    toTemperatureUI,
    toHumidityUI,
    toPressureUI
}

export default uiFormatter