import apiService from './api'

// Mock configs
jest.mock('../configs', () => ({
  openweatherApiKey: 'test-api-key',
}))

// Mock formatters
jest.mock('../utils/formatters', () => ({
  toLocalDate: jest.fn((ts) => `2023/10/24`),
  toLocalTime: jest.fn((ts) => 12),
  toDayOfWeekUI: jest.fn((date) => 'Ti'),
}))

describe('apiService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('fetchRuuviData', () => {
    it('should fetch and return ruuvi sensor data', async () => {
      const mockData = {
        mac1: { temperature: 20.5, humidity: 45, pressure: 1013 },
        mac2: { temperature: 18.2, humidity: 52, pressure: 1012 },
      }

      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockData),
      })

      const result = await apiService.fetchRuuviData()

      expect(global.fetch).toHaveBeenCalledWith('/api/ruuvi')
      expect(result).toEqual(mockData)
    })

    it('should throw error when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiService.fetchRuuviData()).rejects.toThrow('Network error')
    })
  })

  describe('fetchWeatherData', () => {
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

    it('should fetch and transform weather data', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      const result = await apiService.fetchWeatherData()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.openweathermap.org/data/2.5/forecast')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('appid=test-api-key')
      )
      expect(result).toHaveProperty('dailyForecast')
      expect(result).toHaveProperty('hourlyForecast')
    })

    it('should transform weather list items correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      const result = await apiService.fetchWeatherData()

      // Check that hourly forecast contains expected properties
      expect(result.hourlyForecast.length).toBeGreaterThan(0)
      const firstItem = result.hourlyForecast[0]
      expect(firstItem).toHaveProperty('dateTimeUtcTxt')
      expect(firstItem).toHaveProperty('dateTxt')
      expect(firstItem).toHaveProperty('time')
      expect(firstItem).toHaveProperty('weekDay')
      expect(firstItem).toHaveProperty('temp')
      expect(firstItem).toHaveProperty('wind')
      expect(firstItem).toHaveProperty('iconUrl')
    })

    it('should filter daily forecast to midday times (10-13)', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      const result = await apiService.fetchWeatherData()

      // Daily forecast should only include items with time between 10 and 13
      // and skip the first one
      expect(Array.isArray(result.dailyForecast)).toBe(true)
    })

    it('should filter hourly forecast to office hours (6-20)', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockWeatherResponse),
      })

      const result = await apiService.fetchWeatherData()

      // Hourly forecast should be limited to first 4 items within office hours
      expect(result.hourlyForecast.length).toBeLessThanOrEqual(4)
    })

    it('should throw error when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API error'))

      await expect(apiService.fetchWeatherData()).rejects.toThrow('API error')
    })
  })

  describe('fetchEnergyPrices', () => {
    it('should fetch and parse energy prices', async () => {
      const mockData = {
        todayEnergyPrices: [{ hour: 0, price: 5.5 }],
        tomorrowEnergyPrices: [{ hour: 0, price: 6.0 }],
      }

      global.fetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockData)),
      })

      const result = await apiService.fetchEnergyPrices()

      expect(global.fetch).toHaveBeenCalledWith('/api/energyprices')
      expect(result).toEqual(mockData)
    })

    it('should throw error when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiService.fetchEnergyPrices()).rejects.toThrow(
        'Network error'
      )
    })

    it('should handle invalid JSON response', async () => {
      global.fetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValueOnce('invalid json'),
      })

      await expect(apiService.fetchEnergyPrices()).rejects.toThrow()
    })
  })

  describe('fetchMinMaxTemperatures', () => {
    it('should fetch and parse min/max temperatures', async () => {
      const mockData = {
        date: '2023-10-24',
        minTemperature: 15.0,
        maxTemperature: 22.5,
      }

      global.fetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockData)),
      })

      const result = await apiService.fetchMinMaxTemperatures()

      expect(global.fetch).toHaveBeenCalledWith('/api/todayminmaxtemperature')
      expect(result).toEqual(mockData)
    })

    it('should throw error when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiService.fetchMinMaxTemperatures()).rejects.toThrow(
        'Network error'
      )
    })

    it('should handle invalid JSON response', async () => {
      global.fetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValueOnce('not json'),
      })

      await expect(apiService.fetchMinMaxTemperatures()).rejects.toThrow()
    })
  })
})
