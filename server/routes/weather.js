/**
 * Weather API Routes
 *
 * Proxies OpenWeatherMap API calls to keep API key secure on the server.
 * Includes server-side caching with 30-minute TTL.
 */
const express = require('express')
const NodeCache = require('node-cache')
const fetch = require('node-fetch')
const externalApiStatus = require('../services/externalApiStatus')

const router = express.Router()

/** Cache for weather data with 30 minute TTL */
const cache = new NodeCache({ stdTTL: 30 * 60 })
const CACHE_KEY = 'weather'

/** Helsinki coordinates (default location) */
const DEFAULT_LAT = 60.1695
const DEFAULT_LON = 24.9355

/**
 * Convert Unix timestamp to local date string
 * @param {number} unixTimestamp - Unix timestamp in seconds
 * @returns {string} Date string in YYYY/MM/DD format
 */
const toLocalDate = (unixTimestamp) => {
  const date = new Date(unixTimestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

/**
 * Convert Unix timestamp to local hour
 * @param {number} unixTimestamp - Unix timestamp in seconds
 * @returns {number} Hour in local time (0-23)
 */
const toLocalTime = (unixTimestamp) => {
  const date = new Date(unixTimestamp * 1000)
  return date.getHours()
}

/**
 * Convert date string to day of week abbreviation
 * @param {string} dateStr - Date string in format 'YYYY-MM-DD HH:MM:SS'
 * @returns {string} Two-letter day abbreviation in Finnish
 */
const toDayOfWeekUI = (dateStr) => {
  const date = new Date(dateStr.replace(' ', 'T'))
  const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
  return days[date.getDay()]
}

/**
 * Transform OpenWeatherMap response to app format
 * @param {object} data - Raw OpenWeatherMap API response
 * @returns {{dailyForecast: Array, hourlyForecast: Array}}
 */
const transformWeatherData = (data) => {
  const allWeathers = data.list.map((daily) => ({
    dateTimeUtcTxt: daily.dt_txt,
    dateTxt: toLocalDate(daily.dt),
    time: toLocalTime(daily.dt),
    weekDay: toDayOfWeekUI(daily.dt_txt),
    temp: daily.main.temp,
    wind: daily.wind.speed,
    iconUrl: `https://openweathermap.org/img/wn/${daily.weather[0].icon}@2x.png`,
  }))

  const dailyForecast = allWeathers
    .filter((item) => item.time > 10 && item.time < 13)
    .slice(1)

  const officeHours = allWeathers.filter(
    (item) => item.time > 6 && item.time < 20
  )
  const hourlyForecast = officeHours.slice(0, 4)

  return {
    dailyForecast,
    hourlyForecast,
  }
}

/**
 * Fetch weather data from OpenWeatherMap API
 * @returns {Promise<{dailyForecast: Array, hourlyForecast: Array}>}
 */
const fetchWeatherFromApi = async () => {
  const apiKey = process.env.OPENWEATHERMAP_APIKEY

  if (!apiKey) {
    throw new Error('OpenWeatherMap API key not configured')
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${DEFAULT_LAT}&lon=${DEFAULT_LON}&units=metric&appid=${apiKey}`

  const response = await fetch(url)

  if (!response.ok) {
    const errorMessage = `HTTP ${response.status}: ${response.statusText}`
    throw new Error(errorMessage)
  }

  const json = await response.json()
  return transformWeatherData(json)
}

/**
 * GET /api/weather
 *
 * Fetch weather forecast data.
 * Uses server-side caching with 30 minute TTL.
 *
 * Response: {
 *   dailyForecast: Array<{dateTimeUtcTxt, dateTxt, time, weekDay, temp, wind, iconUrl}>,
 *   hourlyForecast: Array<{dateTimeUtcTxt, dateTxt, time, weekDay, temp, wind, iconUrl}>
 * }
 */
router.get('/weather', async (req, res) => {
  try {
    // Check API key first
    if (!process.env.OPENWEATHERMAP_APIKEY) {
      return res.status(500).json({
        error: 'OpenWeatherMap API key not configured',
      })
    }

    // Check cache first
    const cachedData = cache.get(CACHE_KEY)
    if (cachedData) {
      return res.json(cachedData)
    }

    // Fetch fresh data
    const weatherData = await fetchWeatherFromApi()

    // Cache the result
    cache.set(CACHE_KEY, weatherData)

    // Record success
    externalApiStatus.recordSuccess('openWeatherMap')

    return res.json(weatherData)
  } catch (error) {
    // Record error
    externalApiStatus.recordError('openWeatherMap', error.message)

    // eslint-disable-next-line no-console
    console.error('Error fetching weather data:', error)

    return res.status(502).json({
      error: 'Failed to fetch weather data',
      message: error.message,
    })
  }
})

module.exports = router
