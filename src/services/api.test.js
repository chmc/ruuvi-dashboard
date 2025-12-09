import apiService from './api'

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
        json: jest.fn().mockResolvedValueOnce({ success: true, data: mockData }),
      })

      const result = await apiService.fetchRuuviData()

      expect(global.fetch).toHaveBeenCalledWith('/api/ruuvi')
      expect(result).toEqual(mockData)
    })

    it('should throw error when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiService.fetchRuuviData()).rejects.toThrow('Network error')
    })

    it('should throw error when API returns error response', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest
          .fn()
          .mockResolvedValueOnce({
            success: false,
            error: { message: 'Failed to fetch sensor data' },
          }),
      })

      await expect(apiService.fetchRuuviData()).rejects.toThrow(
        'Failed to fetch sensor data'
      )
    })
  })

  describe('fetchWeatherData', () => {
    const mockWeatherForecast = {
      dailyForecast: [
        {
          dateTimeUtcTxt: '2023-10-25 12:00:00',
          dateTxt: '2023/10/25',
          time: 12,
          weekDay: 'Ke',
          temp: 14.0,
          wind: 5.0,
          iconUrl: 'https://openweathermap.org/img/wn/04d@2x.png',
        },
      ],
      hourlyForecast: [
        {
          dateTimeUtcTxt: '2023-10-24 09:00:00',
          dateTxt: '2023/10/24',
          time: 9,
          weekDay: 'Ti',
          temp: 15.5,
          wind: 3.5,
          iconUrl: 'https://openweathermap.org/img/wn/10d@2x.png',
        },
        {
          dateTimeUtcTxt: '2023-10-24 12:00:00',
          dateTxt: '2023/10/24',
          time: 12,
          weekDay: 'Ti',
          temp: 18.2,
          wind: 4.0,
          iconUrl: 'https://openweathermap.org/img/wn/02d@2x.png',
        },
      ],
    }

    it('should fetch weather data from backend proxy', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValueOnce({ success: true, data: mockWeatherForecast }),
      })

      const result = await apiService.fetchWeatherData()

      expect(global.fetch).toHaveBeenCalledWith('/api/weather')
      expect(result).toHaveProperty('dailyForecast')
      expect(result).toHaveProperty('hourlyForecast')
    })

    it('should return weather data with expected structure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValueOnce({ success: true, data: mockWeatherForecast }),
      })

      const result = await apiService.fetchWeatherData()

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

    it('should throw error when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiService.fetchWeatherData()).rejects.toThrow(
        'Network error'
      )
    })

    it('should throw error with message from backend when response is not ok', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: jest.fn().mockResolvedValueOnce({
          success: false,
          error: { message: 'Failed to fetch weather data' },
        }),
      })

      await expect(apiService.fetchWeatherData()).rejects.toThrow(
        'Failed to fetch weather data'
      )
    })

    it('should throw generic error when backend returns no error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest
          .fn()
          .mockResolvedValueOnce({ success: false, error: {} }),
      })

      await expect(apiService.fetchWeatherData()).rejects.toThrow(
        'Request failed'
      )
    })
  })

  describe('fetchEnergyPrices', () => {
    it('should fetch and parse energy prices', async () => {
      const mockData = {
        todayEnergyPrices: [{ hour: 0, price: 5.5 }],
        tomorrowEnergyPrices: [{ hour: 0, price: 6.0 }],
      }

      global.fetch.mockResolvedValueOnce({
        json: jest
          .fn()
          .mockResolvedValueOnce({ success: true, data: mockData }),
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

    it('should throw error on API failure response', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce({
          success: false,
          error: { message: 'Failed to fetch energy prices' },
        }),
      })

      await expect(apiService.fetchEnergyPrices()).rejects.toThrow(
        'Failed to fetch energy prices'
      )
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
        json: jest
          .fn()
          .mockResolvedValueOnce({ success: true, data: mockData }),
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

    it('should return null when cache is empty', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest
          .fn()
          .mockResolvedValueOnce({ success: true, data: null }),
      })

      const result = await apiService.fetchMinMaxTemperatures()
      expect(result).toBeNull()
    })
  })

  describe('fetchHistory', () => {
    const mockHistoryData = [
      {
        timestamp: 1700000000000,
        temperature: 20.5,
        humidity: 45,
        pressure: 1013,
      },
      {
        timestamp: 1700003600000,
        temperature: 21.0,
        humidity: 46,
        pressure: 1014,
      },
      {
        timestamp: 1700007200000,
        temperature: 21.5,
        humidity: 44,
        pressure: 1012,
      },
    ]

    it('should fetch history data for a sensor with default range', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValueOnce({ success: true, data: mockHistoryData }),
      })

      const result = await apiService.fetchHistory('aa:bb:cc:dd:ee:ff')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ruuvi/history?mac=aa:bb:cc:dd:ee:ff&range=24h'
      )
      expect(result).toEqual(mockHistoryData)
    })

    it('should fetch history data with specified range', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValueOnce({ success: true, data: mockHistoryData }),
      })

      await apiService.fetchHistory('aa:bb:cc:dd:ee:ff', '7d')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ruuvi/history?mac=aa:bb:cc:dd:ee:ff&range=7d'
      )
    })

    it('should throw error when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        apiService.fetchHistory('aa:bb:cc:dd:ee:ff')
      ).rejects.toThrow('Network error')
    })

    it('should throw error when API returns error response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({
          success: false,
          error: { message: 'Failed to fetch history data' },
        }),
      })

      await expect(
        apiService.fetchHistory('aa:bb:cc:dd:ee:ff')
      ).rejects.toThrow('Failed to fetch history data')
    })

    it('should return empty array when no data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ success: true, data: [] }),
      })

      const result = await apiService.fetchHistory('aa:bb:cc:dd:ee:ff')

      expect(result).toEqual([])
    })
  })

  describe('flushBuffer', () => {
    it('should flush buffer and return success response', async () => {
      const mockData = {
        flushedCount: 25,
        message: 'Buffer flushed successfully',
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValueOnce({ success: true, data: mockData }),
      })

      const result = await apiService.flushBuffer()

      expect(global.fetch).toHaveBeenCalledWith('/api/diagnostics/flush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockData)
    })

    it('should throw error when response is not ok', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValueOnce({
          success: false,
          error: { message: 'Failed to flush buffer' },
        }),
      })

      await expect(apiService.flushBuffer()).rejects.toThrow(
        'Failed to flush buffer'
      )
    })

    it('should throw error when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiService.flushBuffer()).rejects.toThrow('Network error')
    })

    it('should throw generic error when API returns error without message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValueOnce({
          success: false,
          error: {},
        }),
      })

      await expect(apiService.flushBuffer()).rejects.toThrow('Request failed')
    })
  })
})
