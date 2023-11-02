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
 * @property    {string}    pricesForDate   Format YYYY-MM-DD
 * @property    {EnergyPrice[]}  data
 */

/**
 * @typedef     EnergyPrice
 * @type        {object}
 * @property    {Date}      date
 * @property    {number}    price   cent, like: 0.05
 * @property    {number}    hour    0-23
 */

/**
 * @typedef {Object} SensorData
 * @property {number} data_format
 * @property {number} humidity
 * @property {number} temperature
 * @property {number} pressure
 */

/**
 * @typedef {Object} Configs
 * @property {string[]} macIds
 * @property {RuuviTag[]} ruuviTags
 * @property {string} mainIndoorMac
 * @property {string} mainOutdoorMac
 * @property {string} openweatherApiKey
 */

/**
 * @typedef {Object} RuuviTag
 * @property {string} mac
 * @property {string} name
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

/**
 * @typedef {Object} WeatherForecast
 * @property {Weather[]} hourlyForecast
 * @property {Weather[]} dailyForecast
 */

/**
 * @typedef {Object} Weather
 * @property {string} dateTimeUtcTxt    Date and time in UTC
 * @property {string} dateTxt           YYYY/MM/DD
 * @property {number} time              Hour part of local time
 * @property {string} weekDay           Finnish weekday name NN
 * @property {number} temp
 * @property {number} wind
 * @property {string} iconUrl
 */
