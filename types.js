/**
 * @typedef     AppStorage  Persisted application storage
 * @type        {object}
 * @property    {DailyEnergyPrices=}    todayEnergyPrices
 * @property    {DailyEnergyPrices=}    tomorrowEnergyPrices
 */

/**
 * @typedef     EnergyPrices
 * @type        {object}
 * @property    {Date}                  updatedAt
 * @property    {DailyEnergyPrices=}    todayEnergyPrices
 * @property    {DailyEnergyPrices=}    tomorrowEnergyPrices
 */

/**
 * @typedef     DailyEnergyPrices
 * @type        {object}
 * @property    {Date}      updatedAt
 * @property    {string}    pricesForDate
 * @property    {EnergyPrice[]}  data
 */

/**
 * @typedef     EnergyPrice
 * @type        {object}
 * @property    {Date}      date
 * @property    {number}    price
 * @property    {number}    hour
 */

/**
 * @typedef {Object} SensorData
 * @property {number} data_format
 * @property {number} humidity
 * @property {number} temperature
 * @property {number} pressure
 */

/**
 * @typedef {Object.<string, SensorData>} SensorDataCollection
 */

/**
 * @typedef {Object} TodayMinMaxTemperature
 * @property {Date} date
 * @property {number} minTemperature
 * @property {number} maxTemperature
 */
