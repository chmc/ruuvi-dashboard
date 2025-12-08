/**
 * @jest-environment node
 */
/* eslint-disable global-require */

const request = require('supertest')
const express = require('express')

// Mock node-fetch before importing the route
jest.mock('node-fetch')

// Mock externalApiStatus
jest.mock('../services/externalApiStatus')

// We need to re-require the module in each test to clear cache
let weatherRouter
let fetch
let externalApiStatus

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/api', weatherRouter)
  return app
}

describe('Weather API Endpoint', () => {
  let app

  beforeEach(() => {
    // Clear module cache to get fresh instances with empty cache
    jest.resetModules()

    // Re-require modules after reset
    jest.mock('node-fetch')
    jest.mock('../services/externalApiStatus')

    fetch = require('node-fetch')
    externalApiStatus = require('../services/externalApiStatus')
    weatherRouter = require('./weather')

    jest.clearAllMocks()
    app = createTestApp()

    // Set required env var
    process.env.OPENWEATHERMAP_APIKEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.OPENWEATHERMAP_APIKEY
  })

  describe('GET /api/weather', () => {
    const mockWeatherResponse = {
      list: [
        {
          dt_txt: '2023-10-24 09:00:00',
          dt: 1698138000,
          main: { temp: 15.5 },
          wind: { speed: 3.5 },
          weather: [{ icon: '10d' }],
        },
        {
          dt_txt: '2023-10-24 12:00:00',
          dt: 1698148800,
          main: { temp: 18.2 },
          wind: { speed: 4.0 },
          weather: [{ icon: '02d' }],
        },
        {
          dt_txt: '2023-10-24 15:00:00',
          dt: 1698159600,
          main: { temp: 17.0 },
          wind: { speed: 3.8 },
          weather: [{ icon: '03d' }],
        },
        {
          dt_txt: '2023-10-25 12:00:00',
          dt: 1698235200,
          main: { temp: 14.0 },
          wind: { speed: 5.0 },
          weather: [{ icon: '04d' }],
        },
      ],
    }

    it('should fetch weather data from OpenWeatherMap API', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      const response = await request(app).get('/api/weather')

      expect(response.status).toBe(200)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.openweathermap.org/data/2.5/forecast')
      )
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('appid=test-api-key')
      )
    })

    it('should return transformed weather data with daily and hourly forecasts', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      const response = await request(app).get('/api/weather')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('dailyForecast')
      expect(response.body).toHaveProperty('hourlyForecast')
    })

    it('should transform weather list items with correct properties', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      const response = await request(app).get('/api/weather')

      expect(response.status).toBe(200)
      expect(response.body.hourlyForecast.length).toBeGreaterThan(0)
      const firstItem = response.body.hourlyForecast[0]
      expect(firstItem).toHaveProperty('dateTimeUtcTxt')
      expect(firstItem).toHaveProperty('dateTxt')
      expect(firstItem).toHaveProperty('time')
      expect(firstItem).toHaveProperty('weekDay')
      expect(firstItem).toHaveProperty('temp')
      expect(firstItem).toHaveProperty('wind')
      expect(firstItem).toHaveProperty('iconUrl')
    })

    it('should generate correct icon URLs', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      const response = await request(app).get('/api/weather')

      expect(response.status).toBe(200)
      const firstItem = response.body.hourlyForecast[0]
      expect(firstItem.iconUrl).toMatch(
        /^https:\/\/openweathermap\.org\/img\/wn\/\w+@2x\.png$/
      )
    })

    it('should filter hourly forecast to office hours (6-20) and limit to 4', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      const response = await request(app).get('/api/weather')

      expect(response.status).toBe(200)
      expect(response.body.hourlyForecast.length).toBeLessThanOrEqual(4)
    })

    it('should record success status when fetch succeeds', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      await request(app).get('/api/weather')

      expect(externalApiStatus.recordSuccess).toHaveBeenCalledWith(
        'openWeatherMap'
      )
    })

    it('should record error status when fetch fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      const response = await request(app).get('/api/weather')

      expect(response.status).toBe(502)
      expect(externalApiStatus.recordError).toHaveBeenCalledWith(
        'openWeatherMap',
        expect.stringContaining('Network error')
      )
    })

    it('should record error status when API returns non-ok response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      const response = await request(app).get('/api/weather')

      expect(response.status).toBe(502)
      expect(externalApiStatus.recordError).toHaveBeenCalledWith(
        'openWeatherMap',
        expect.stringContaining('401')
      )
    })

    it('should return error when API key is not configured', async () => {
      delete process.env.OPENWEATHERMAP_APIKEY

      const response = await request(app).get('/api/weather')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('API key')
    })

    it('should include coordinates in the API request', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      await request(app).get('/api/weather')

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('lat='))
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('lon='))
    })

    it('should request metric units', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      await request(app).get('/api/weather')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('units=metric')
      )
    })
  })

  describe('Cache behavior', () => {
    it('should cache responses and not call API on second request', async () => {
      const mockWeatherResponse = {
        list: [
          {
            dt_txt: '2023-10-24 12:00:00',
            dt: 1698148800,
            main: { temp: 18.2 },
            wind: { speed: 4.0 },
            weather: [{ icon: '02d' }],
          },
        ],
      }

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWeatherResponse),
      })

      // First request should call fetch
      const response1 = await request(app).get('/api/weather')
      expect(response1.status).toBe(200)
      expect(fetch).toHaveBeenCalledTimes(1)

      // Second request should use cache
      const response2 = await request(app).get('/api/weather')
      expect(response2.status).toBe(200)
      expect(fetch).toHaveBeenCalledTimes(1) // Still 1, not 2
    })
  })
})
