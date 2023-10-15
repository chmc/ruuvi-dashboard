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
 * @property    {Date}      aikaleima_suomi
 * @property    {Date}      aikaleima_utc
 * @property    {number}    hinta
 */
