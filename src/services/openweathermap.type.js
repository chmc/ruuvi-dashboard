/**
 * @typedef {Object} WeatherData
 * @property {string} cod
 * @property {number} message
 * @property {number} cnt
 * @property {WeatherInfo[]} list
 * @property {CityInfo} city
 */

/**
 * @typedef {Object} WeatherInfo
 * @property {number} dt
 * @property {MainInfo} main
 * @property {WeatherDescription[]} weather
 * @property {CloudsInfo} clouds
 * @property {WindInfo} wind
 * @property {number} visibility
 * @property {number} pop
 * @property {SysInfo} sys
 * @property {string} dt_txt
 */

/**
 * @typedef {Object} MainInfo
 * @property {number} temp
 * @property {number} feels_like
 * @property {number} temp_min
 * @property {number} temp_max
 * @property {number} pressure
 * @property {number} sea_level
 * @property {number} grnd_level
 * @property {number} humidity
 * @property {number} temp_kf
 */

/**
 * @typedef {Object} WeatherDescription
 * @property {number} id
 * @property {string} main
 * @property {string} description
 * @property {string} icon
 */

/**
 * @typedef {Object} CloudsInfo
 * @property {number} all
 */

/**
 * @typedef {Object} WindInfo
 * @property {number} speed
 * @property {number} deg
 * @property {number} gust
 */

/**
 * @typedef {Object} SysInfo
 * @property {string} pod
 */

/**
 * @typedef {Object} CityInfo
 * @property {number} id
 * @property {string} name
 * @property {CoordinateInfo} coord
 * @property {string} country
 * @property {number} population
 * @property {number} timezone
 * @property {number} sunrise
 * @property {number} sunset
 */

/**
 * @typedef {Object} CoordinateInfo
 * @property {number} lat
 * @property {number} lon
 */
