/**
 * AppStorage
 * @typedef     AppStorage  Persisted application storage
 * @type        {object}
 * @property    {TodayEnergyPrices}    todayEnergyPrices
 */

/**
 * TodayEnergyPrices
 * @typedef     TodayEnergyPrices
 * @type        {object}
 * @property    {Date}      updatedAt
 * @property    {string}    pricesForDate
 * @property    {EnergyPrice[]}  data
 */

/**
 * EnergyPrice
 * @typedef     EnergyPrice
 * @type        {object}
 * @property    {Date}      date
 * @property    {number}    price
 * @property    {number}    hour
 */
