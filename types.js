/**
 * AppStorage
 * @typedef     AppStorage  Persisted application storage
 * @type        {object}
 * @property    {DailyEnergyPrices=}    todayEnergyPrices
 * @property    {DailyEnergyPrices=}    tomorrowEnergyPrices
 */

/**
 * EnergyPrices
 * @typedef     EnergyPrices  Persisted application storage
 * @type        {object}
 * @property    {Date}                  updatedAt
 * @property    {DailyEnergyPrices=}    todayEnergyPrices
 * @property    {DailyEnergyPrices=}    tomorrowEnergyPrices
 */

/**
 * DailyEnergyPrices
 * @typedef     DailyEnergyPrices
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
