/**
 * @jest-environment node
 */

const request = require('supertest')

// Mock dependencies before importing the server
jest.mock('./services/temperature')
jest.mock('./services/energyPrices')
jest.mock('./services/sensor')
jest.mock('./storage')
jest.mock('./utils/simulator')

// Set test environment
process.env.TEST = 'true'
process.env.VITE_RUUVITAG_MACS = 'mac1,mac2'

// Create a minimal express app for testing (isolate from real server)
const express = require('express')
const NodeCache = require('node-cache')
const temperatureService = require('./services/temperature')
const energyPricesService = require('./services/energyPrices')
const sensorService = require('./services/sensor')
const storage = require('./storage')

const createTestApp = () => {
  const app = express()
  const cache = new NodeCache()
  const cacheKeys = {
    ruuvi: 'ruuvi',
    energyPrices: 'energyPrices',
    todayMinMax: 'todayMinMax',
  }

  app.use(express.json())

  // Expose cache for test manipulation
  app.testCache = cache
  app.cacheKeys = cacheKeys

  app.get('/api/ruuvi', (req, res) => {
    res.send(cache.get(cacheKeys.ruuvi))
  })

  app.post('/api/ruuvi', (req, res) => {
    try {
      const sensorDataCollection = sensorService.getSensorData(
        req.body,
        cache.get(cacheKeys.ruuvi),
        process.env.VITE_RUUVITAG_MACS?.split(',')
      )
      cache.set(cacheKeys.ruuvi, sensorDataCollection)

      const todayminmaxtemperature =
        temperatureService.getTodayMinMaxTemperature(
          sensorDataCollection,
          cache.get(cacheKeys.todayMinMax)
        )
      if (todayminmaxtemperature) {
        cache.set(cacheKeys.todayMinMax, todayminmaxtemperature)
      }

      res
        .status(200)
        .json({ message: 'Data received and processed successfully' })
    } catch (error) {
      res
        .status(500)
        .json({ error: 'An error occurred while processing the data' })
    }
  })

  app.get('/api/energyprices', async (req, res) => {
    let cachedEnergyPrices = cache.get(cacheKeys.energyPrices)

    if (!cachedEnergyPrices) {
      const appStorage = await storage.loadOrDefaultSync()
      cachedEnergyPrices = {
        updatedAt: appStorage.todayEnergyPrices?.updatedAt,
        todayEnergyPrices: appStorage.todayEnergyPrices,
        tomorrowEnergyPrices: appStorage.tomorrowEnergyPrices,
      }
    }
    const energyPrices =
      await energyPricesService.getEnergyPrices(cachedEnergyPrices)
    cache.set(cacheKeys.energyPrices, energyPrices)

    const energyPricesForClient = {
      todayEnergyPrices: energyPrices.todayEnergyPrices?.data,
      tomorrowEnergyPrices: energyPrices.tomorrowEnergyPrices?.data,
    }
    res.send(energyPricesForClient)
  })

  app.get('/api/todayminmaxtemperature', async (req, res) => {
    res.send(cache.get(cacheKeys.todayMinMax))
  })

  return app
}

describe('API Endpoints', () => {
  let app

  beforeEach(() => {
    jest.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /api/ruuvi', () => {
    it('should return undefined when cache is empty', async () => {
      const response = await request(app).get('/api/ruuvi')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({})
    })

    it('should return cached sensor data', async () => {
      const sensorData = {
        mac1: { temperature: 20.5, humidity: 45, pressure: 1013, mac: 'mac1' },
        mac2: { temperature: 18.2, humidity: 52, pressure: 1012, mac: 'mac2' },
      }
      app.testCache.set(app.cacheKeys.ruuvi, sensorData)

      const response = await request(app).get('/api/ruuvi')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(sensorData)
    })
  })

  describe('POST /api/ruuvi', () => {
    it('should process and cache sensor data successfully', async () => {
      const incomingData = {
        mac1: { temperature: 21.0, humidity: 46, pressure: 1014, mac: 'mac1' },
      }

      const processedData = {
        mac1: { temperature: 21.0, humidity: 46, pressure: 1014, mac: 'mac1' },
        mac2: { temperature: 19.0, humidity: 50, pressure: 1010, mac: 'mac2' },
      }

      sensorService.getSensorData.mockReturnValue(processedData)
      temperatureService.getTodayMinMaxTemperature.mockReturnValue({
        date: new Date(),
        minTemperature: 19.0,
        maxTemperature: 21.0,
      })

      const response = await request(app)
        .post('/api/ruuvi')
        .send(incomingData)
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Data received and processed successfully',
      })
      expect(sensorService.getSensorData).toHaveBeenCalledWith(
        incomingData,
        undefined,
        ['mac1', 'mac2']
      )
    })

    it('should return 500 when processing fails', async () => {
      sensorService.getSensorData.mockImplementation(() => {
        throw new Error('Processing error')
      })

      const response = await request(app)
        .post('/api/ruuvi')
        .send({ invalid: 'data' })
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        error: 'An error occurred while processing the data',
      })
    })

    it('should update min/max temperature cache', async () => {
      const sensorData = {
        mac1: { temperature: 25.0, humidity: 40, pressure: 1015, mac: 'mac1' },
      }

      const minMaxTemp = {
        date: new Date('2023-10-24'),
        minTemperature: 18.0,
        maxTemperature: 25.0,
      }

      sensorService.getSensorData.mockReturnValue(sensorData)
      temperatureService.getTodayMinMaxTemperature.mockReturnValue(minMaxTemp)

      await request(app)
        .post('/api/ruuvi')
        .send(sensorData)
        .set('Content-Type', 'application/json')

      expect(temperatureService.getTodayMinMaxTemperature).toHaveBeenCalled()
      expect(app.testCache.get(app.cacheKeys.todayMinMax)).toEqual(minMaxTemp)
    })
  })

  describe('GET /api/energyprices', () => {
    it('should return energy prices from service', async () => {
      const mockEnergyPrices = {
        todayEnergyPrices: {
          data: [
            { hour: 0, price: 5.5 },
            { hour: 1, price: 4.2 },
          ],
        },
        tomorrowEnergyPrices: {
          data: [
            { hour: 0, price: 6.0 },
            { hour: 1, price: 5.8 },
          ],
        },
      }

      storage.loadOrDefaultSync.mockReturnValue({})
      energyPricesService.getEnergyPrices.mockResolvedValue(mockEnergyPrices)

      const response = await request(app).get('/api/energyprices')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        todayEnergyPrices: mockEnergyPrices.todayEnergyPrices.data,
        tomorrowEnergyPrices: mockEnergyPrices.tomorrowEnergyPrices.data,
      })
    })

    it('should load from storage when cache is empty', async () => {
      const storedData = {
        todayEnergyPrices: {
          data: [{ hour: 0, price: 7.0 }],
          updatedAt: new Date(),
        },
        tomorrowEnergyPrices: null,
      }

      storage.loadOrDefaultSync.mockReturnValue(storedData)
      energyPricesService.getEnergyPrices.mockResolvedValue({
        todayEnergyPrices: storedData.todayEnergyPrices,
        tomorrowEnergyPrices: null,
      })

      const response = await request(app).get('/api/energyprices')

      expect(response.status).toBe(200)
      expect(storage.loadOrDefaultSync).toHaveBeenCalled()
    })

    it('should cache energy prices after fetching', async () => {
      const mockEnergyPrices = {
        todayEnergyPrices: { data: [{ hour: 0, price: 5.5 }] },
        tomorrowEnergyPrices: null,
      }

      storage.loadOrDefaultSync.mockReturnValue({})
      energyPricesService.getEnergyPrices.mockResolvedValue(mockEnergyPrices)

      await request(app).get('/api/energyprices')

      expect(app.testCache.get(app.cacheKeys.energyPrices)).toEqual(
        mockEnergyPrices
      )
    })
  })

  describe('GET /api/todayminmaxtemperature', () => {
    it('should return undefined when cache is empty', async () => {
      const response = await request(app).get('/api/todayminmaxtemperature')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({})
    })

    it('should return cached min/max temperature', async () => {
      const minMaxTemp = {
        date: new Date('2023-10-24').toISOString(),
        minTemperature: 15.0,
        maxTemperature: 22.5,
      }
      app.testCache.set(app.cacheKeys.todayMinMax, minMaxTemp)

      const response = await request(app).get('/api/todayminmaxtemperature')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(minMaxTemp)
    })
  })
})
