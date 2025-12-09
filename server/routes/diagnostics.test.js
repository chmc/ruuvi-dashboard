/**
 * @jest-environment node
 */

const request = require('supertest')
const express = require('express')

// Mock dependencies before importing the route
jest.mock('../services/history/historyDb')
jest.mock('../services/history/historyBuffer')
jest.mock('../services/history/flushScheduler')
jest.mock('../services/externalApiStatus')

const historyDb = require('../services/history/historyDb')
const historyBuffer = require('../services/history/historyBuffer')
const flushScheduler = require('../services/history/flushScheduler')
const externalApiStatus = require('../services/externalApiStatus')
const diagnosticsRouter = require('./diagnostics')
const {
  setScannerHealthGetter,
  setExternalApiStatusGetter,
} = require('./diagnostics')

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/api', diagnosticsRouter)
  return app
}

describe('Diagnostics API Endpoint', () => {
  let app

  beforeEach(() => {
    jest.clearAllMocks()
    app = createTestApp()

    // Default mock implementations
    historyBuffer.getBufferSize.mockReturnValue(0)
    historyBuffer.getBufferContents.mockReturnValue([])
    flushScheduler.getLastFlushTime.mockReturnValue(null)
    historyDb.getLatestReading.mockReturnValue(undefined)
    historyDb.isOpen.mockReturnValue(true)
    historyDb.getDbPath.mockReturnValue('/path/to/test.db')
    historyDb.getDb.mockReturnValue({
      pragma: jest.fn().mockReturnValue([{ page_count: 100, page_size: 4096 }]),
    })

    // Default external API status mock
    externalApiStatus.getStatus.mockReturnValue({
      energyPrices: {
        status: 'unknown',
        lastSuccess: null,
        lastError: null,
        errorMessage: null,
      },
      openWeatherMap: {
        status: 'unknown',
        lastSuccess: null,
        lastError: null,
        errorMessage: null,
      },
    })

    // Set up the external API status getter
    setExternalApiStatusGetter(() => externalApiStatus.getStatus())
  })

  describe('GET /api/diagnostics', () => {
    it('should return system status', async () => {
      historyBuffer.getBufferSize.mockReturnValue(42)
      flushScheduler.getLastFlushTime.mockReturnValue(1700000000000)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('bufferSize')
      expect(response.body.data).toHaveProperty('lastFlushTime')
      expect(response.body.data).toHaveProperty('batteries')
      expect(response.body.data).toHaveProperty('dbSize')
      expect(response.body.data).toHaveProperty('uptime')
    })

    it('should include buffer size', async () => {
      historyBuffer.getBufferSize.mockReturnValue(150)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.bufferSize).toBe(150)
    })

    it('should include last flush time', async () => {
      const flushTime = Date.now() - 60000
      flushScheduler.getLastFlushTime.mockReturnValue(flushTime)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.lastFlushTime).toBe(flushTime)
    })

    it('should include battery levels for all sensors', async () => {
      // Setup mock for battery levels query
      historyDb.getLatestReading.mockImplementation((mac) => {
        if (mac === 'aa:bb:cc:dd:ee:01') {
          return { mac, battery: 3.05, timestamp: Date.now() }
        }
        if (mac === 'aa:bb:cc:dd:ee:02') {
          return { mac, battery: 2.65, timestamp: Date.now() }
        }
        return undefined
      })

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01,aa:bb:cc:dd:ee:02' })

      expect(response.status).toBe(200)
      expect(response.body.data.batteries).toHaveLength(2)
      expect(response.body.data.batteries[0]).toEqual({
        mac: 'aa:bb:cc:dd:ee:01',
        voltage: 3.05,
        lastSeen: expect.any(Number),
      })
      expect(response.body.data.batteries[1]).toEqual({
        mac: 'aa:bb:cc:dd:ee:02',
        voltage: 2.65,
        lastSeen: expect.any(Number),
      })
    })

    it('should fall back to buffer for battery levels when DB has no data', async () => {
      // DB returns nothing
      historyDb.getLatestReading.mockReturnValue(undefined)

      // Buffer has readings
      const bufferTimestamp = Date.now()
      historyBuffer.getBufferContents.mockReturnValue([
        {
          mac: 'aa:bb:cc:dd:ee:01',
          battery: 2900,
          timestamp: bufferTimestamp - 1000,
        },
        {
          mac: 'aa:bb:cc:dd:ee:01',
          battery: 2905,
          timestamp: bufferTimestamp,
        },
        {
          mac: 'aa:bb:cc:dd:ee:02',
          battery: 2750,
          timestamp: bufferTimestamp,
        },
      ])

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01,aa:bb:cc:dd:ee:02' })

      expect(response.status).toBe(200)
      expect(response.body.data.batteries).toHaveLength(2)
      // Should get the latest reading from buffer (2905, not 2900)
      expect(response.body.data.batteries[0]).toEqual({
        mac: 'aa:bb:cc:dd:ee:01',
        voltage: 2905,
        lastSeen: bufferTimestamp,
      })
      expect(response.body.data.batteries[1]).toEqual({
        mac: 'aa:bb:cc:dd:ee:02',
        voltage: 2750,
        lastSeen: bufferTimestamp,
      })
    })

    it('should prefer buffer battery data when more recent than DB', async () => {
      const dbTimestamp = Date.now() - 60000 // 1 minute ago
      const bufferTimestamp = Date.now() // now

      historyDb.getLatestReading.mockImplementation((mac) => {
        if (mac === 'aa:bb:cc:dd:ee:01') {
          return { mac, battery: 2800, timestamp: dbTimestamp }
        }
        return undefined
      })

      historyBuffer.getBufferContents.mockReturnValue([
        {
          mac: 'aa:bb:cc:dd:ee:01',
          battery: 2850,
          timestamp: bufferTimestamp,
        },
      ])

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01' })

      expect(response.status).toBe(200)
      // Should prefer the more recent buffer reading
      expect(response.body.data.batteries[0]).toEqual({
        mac: 'aa:bb:cc:dd:ee:01',
        voltage: 2850,
        lastSeen: bufferTimestamp,
      })
    })

    it('should include database size', async () => {
      const mockDb = {
        pragma: jest.fn().mockImplementation((query) => {
          if (query === 'page_count') return [{ page_count: 1000 }]
          if (query === 'page_size') return [{ page_size: 4096 }]
          return []
        }),
      }
      historyDb.getDb.mockReturnValue(mockDb)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dbSize).toBe(1000 * 4096) // 4MB
    })

    it('should include oldest record timestamp', async () => {
      const mockDb = {
        pragma: jest
          .fn()
          .mockReturnValue([{ page_count: 100, page_size: 4096 }]),
        prepare: jest.fn().mockReturnValue({
          get: jest.fn().mockReturnValue({ oldest_timestamp: 1600000000000 }),
        }),
      }
      historyDb.getDb.mockReturnValue(mockDb)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.oldestRecord).toBe(1600000000000)
    })

    it('should include uptime', async () => {
      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(typeof response.body.data.uptime).toBe('number')
      expect(response.body.data.uptime).toBeGreaterThanOrEqual(0)
    })

    it('should handle database not open gracefully', async () => {
      historyDb.isOpen.mockReturnValue(false)
      historyDb.getDb.mockReturnValue(null)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dbSize).toBe(0)
      expect(response.body.data.oldestRecord).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      historyBuffer.getBufferSize.mockImplementation(() => {
        throw new Error('Buffer error')
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Failed to fetch diagnostics data')
    })
  })

  describe('Sensor Health', () => {
    it('should include sensor health data when scanner is available', async () => {
      const now = Date.now()
      const mockScannerHealth = {
        'aa:bb:cc:dd:ee:01': { lastSeen: now - 5000, rssi: -65 },
        'aa:bb:cc:dd:ee:02': { lastSeen: now - 10000, rssi: -80 },
      }

      setScannerHealthGetter(() => mockScannerHealth)

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01,aa:bb:cc:dd:ee:02' })

      expect(response.status).toBe(200)
      expect(response.body.data.sensorHealth).toBeDefined()
      expect(response.body.data.sensorHealth).toHaveLength(2)
    })

    it('should include last seen timestamp for each sensor', async () => {
      const now = Date.now()
      const mockScannerHealth = {
        'aa:bb:cc:dd:ee:01': { lastSeen: now - 5000, rssi: -65 },
      }

      setScannerHealthGetter(() => mockScannerHealth)

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01' })

      expect(response.status).toBe(200)
      expect(response.body.data.sensorHealth[0].lastSeen).toBe(now - 5000)
    })

    it('should include RSSI (signal strength) for each sensor', async () => {
      const now = Date.now()
      const mockScannerHealth = {
        'aa:bb:cc:dd:ee:01': { lastSeen: now, rssi: -65 },
      }

      setScannerHealthGetter(() => mockScannerHealth)

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01' })

      expect(response.status).toBe(200)
      expect(response.body.data.sensorHealth[0].rssi).toBe(-65)
    })

    it('should detect stale sensors (>5 min since last reading)', async () => {
      const now = Date.now()
      const fiveMinutesAgo = now - 5 * 60 * 1000 - 1000 // Just over 5 minutes
      const mockScannerHealth = {
        'aa:bb:cc:dd:ee:01': { lastSeen: fiveMinutesAgo, rssi: -65 },
      }

      setScannerHealthGetter(() => mockScannerHealth)

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01' })

      expect(response.status).toBe(200)
      expect(response.body.data.sensorHealth[0].status).toBe('stale')
    })

    it('should mark sensor as online when recently seen', async () => {
      const now = Date.now()
      const mockScannerHealth = {
        'aa:bb:cc:dd:ee:01': { lastSeen: now - 30000, rssi: -65 }, // 30 seconds ago
      }

      setScannerHealthGetter(() => mockScannerHealth)

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01' })

      expect(response.status).toBe(200)
      expect(response.body.data.sensorHealth[0].status).toBe('online')
    })

    it('should mark sensor as offline when never seen', async () => {
      setScannerHealthGetter(() => ({}))

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01' })

      expect(response.status).toBe(200)
      expect(response.body.data.sensorHealth[0].status).toBe('offline')
      expect(response.body.data.sensorHealth[0].lastSeen).toBeNull()
      expect(response.body.data.sensorHealth[0].rssi).toBeNull()
    })

    it('should handle missing scanner gracefully', async () => {
      setScannerHealthGetter(null)

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01' })

      expect(response.status).toBe(200)
      expect(response.body.data.sensorHealth).toBeDefined()
      expect(response.body.data.sensorHealth[0].status).toBe('offline')
    })

    it('should include sensor health for all requested MACs', async () => {
      const now = Date.now()
      const mockScannerHealth = {
        'aa:bb:cc:dd:ee:01': { lastSeen: now, rssi: -65 },
        // aa:bb:cc:dd:ee:02 is not in scanner health (never seen)
      }

      setScannerHealthGetter(() => mockScannerHealth)

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01,aa:bb:cc:dd:ee:02' })

      expect(response.status).toBe(200)
      expect(response.body.data.sensorHealth).toHaveLength(2)
      expect(response.body.data.sensorHealth[0].mac).toBe('aa:bb:cc:dd:ee:01')
      expect(response.body.data.sensorHealth[0].status).toBe('online')
      expect(response.body.data.sensorHealth[1].mac).toBe('aa:bb:cc:dd:ee:02')
      expect(response.body.data.sensorHealth[1].status).toBe('offline')
    })
  })

  describe('System Resources', () => {
    it('should include memory usage (heap used/total)', async () => {
      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.systemResources).toBeDefined()
      expect(response.body.data.systemResources.memory).toBeDefined()
      expect(response.body.data.systemResources.memory.heapUsed).toEqual(
        expect.any(Number)
      )
      expect(response.body.data.systemResources.memory.heapTotal).toEqual(
        expect.any(Number)
      )
      expect(response.body.data.systemResources.memory.heapUsed).toBeGreaterThan(0)
      expect(response.body.data.systemResources.memory.heapTotal).toBeGreaterThan(0)
    })

    it('should include Node.js version', async () => {
      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.systemResources).toBeDefined()
      expect(response.body.data.systemResources.nodeVersion).toBeDefined()
      expect(response.body.data.systemResources.nodeVersion).toMatch(
        /^v?\d+\.\d+\.\d+/
      )
    })

    it('should include disk space remaining', async () => {
      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.systemResources).toBeDefined()
      expect(response.body.data.systemResources.disk).toBeDefined()
      expect(response.body.data.systemResources.disk.free).toEqual(
        expect.any(Number)
      )
      expect(response.body.data.systemResources.disk.total).toEqual(
        expect.any(Number)
      )
      expect(response.body.data.systemResources.disk.free).toBeGreaterThanOrEqual(0)
      expect(response.body.data.systemResources.disk.total).toBeGreaterThan(0)
    })

    it('should include RSS memory', async () => {
      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.systemResources.memory.rss).toEqual(
        expect.any(Number)
      )
      expect(response.body.data.systemResources.memory.rss).toBeGreaterThan(0)
    })

    it('should include external memory', async () => {
      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.systemResources.memory.external).toEqual(
        expect.any(Number)
      )
    })
  })

  describe('External API Status', () => {
    it('should include external API status for energy prices', async () => {
      externalApiStatus.getStatus.mockReturnValue({
        energyPrices: {
          status: 'ok',
          lastSuccess: 1700000000000,
          lastError: null,
          errorMessage: null,
        },
        openWeatherMap: {
          status: 'unknown',
          lastSuccess: null,
          lastError: null,
          errorMessage: null,
        },
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.externalApis).toBeDefined()
      expect(response.body.data.externalApis.energyPrices.status).toBe('ok')
      expect(response.body.data.externalApis.energyPrices.lastSuccess).toBe(
        1700000000000
      )
    })

    it('should include external API status for OpenWeatherMap', async () => {
      externalApiStatus.getStatus.mockReturnValue({
        energyPrices: {
          status: 'unknown',
          lastSuccess: null,
          lastError: null,
          errorMessage: null,
        },
        openWeatherMap: {
          status: 'ok',
          lastSuccess: 1700000000000,
          lastError: null,
          errorMessage: null,
        },
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.externalApis).toBeDefined()
      expect(response.body.data.externalApis.openWeatherMap.status).toBe('ok')
      expect(response.body.data.externalApis.openWeatherMap.lastSuccess).toBe(
        1700000000000
      )
    })

    it('should include error message when API has error', async () => {
      externalApiStatus.getStatus.mockReturnValue({
        energyPrices: {
          status: 'error',
          lastSuccess: 1699000000000,
          lastError: 1700000000000,
          errorMessage: 'Network timeout',
        },
        openWeatherMap: {
          status: 'unknown',
          lastSuccess: null,
          lastError: null,
          errorMessage: null,
        },
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.externalApis.energyPrices.status).toBe('error')
      expect(response.body.data.externalApis.energyPrices.errorMessage).toBe(
        'Network timeout'
      )
      expect(response.body.data.externalApis.energyPrices.lastError).toBe(
        1700000000000
      )
    })

    it('should include last successful fetch timestamp', async () => {
      const lastSuccessTime = Date.now() - 60000
      externalApiStatus.getStatus.mockReturnValue({
        energyPrices: {
          status: 'ok',
          lastSuccess: lastSuccessTime,
          lastError: null,
          errorMessage: null,
        },
        openWeatherMap: {
          status: 'ok',
          lastSuccess: lastSuccessTime,
          lastError: null,
          errorMessage: null,
        },
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.externalApis.energyPrices.lastSuccess).toBe(
        lastSuccessTime
      )
      expect(response.body.data.externalApis.openWeatherMap.lastSuccess).toBe(
        lastSuccessTime
      )
    })
  })

  describe('POST /api/diagnostics/flush', () => {
    it('should trigger immediate flush', async () => {
      flushScheduler.forceFlush.mockReturnValue({ flushedCount: 25 })

      const response = await request(app).post('/api/diagnostics/flush')

      expect(flushScheduler.forceFlush).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('should return success confirmation', async () => {
      flushScheduler.forceFlush.mockReturnValue({ flushedCount: 50 })

      const response = await request(app).post('/api/diagnostics/flush')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual({
        flushedCount: 50,
        message: 'Buffer flushed successfully',
      })
    })

    it('should return zero count when buffer was empty', async () => {
      flushScheduler.forceFlush.mockReturnValue({ flushedCount: 0 })

      const response = await request(app).post('/api/diagnostics/flush')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.flushedCount).toBe(0)
    })

    it('should handle flush when scheduler not running', async () => {
      flushScheduler.forceFlush.mockReturnValue(null)

      const response = await request(app).post('/api/diagnostics/flush')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual({
        flushedCount: 0,
        message: 'Buffer flushed successfully',
      })
    })

    it('should handle flush errors gracefully', async () => {
      flushScheduler.forceFlush.mockImplementation(() => {
        throw new Error('Flush failed')
      })

      const response = await request(app).post('/api/diagnostics/flush')

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Failed to flush buffer')
    })
  })

  describe('POST /api/diagnostics/api-status', () => {
    it('should record success status for openWeatherMap', async () => {
      const response = await request(app)
        .post('/api/diagnostics/api-status')
        .send({ api: 'openWeatherMap', status: 'success' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual({ recorded: true })
      expect(externalApiStatus.recordSuccess).toHaveBeenCalledWith(
        'openWeatherMap'
      )
    })

    it('should record error status for openWeatherMap', async () => {
      const response = await request(app)
        .post('/api/diagnostics/api-status')
        .send({
          api: 'openWeatherMap',
          status: 'error',
          errorMessage: 'Invalid API key',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual({ recorded: true })
      expect(externalApiStatus.recordError).toHaveBeenCalledWith(
        'openWeatherMap',
        'Invalid API key'
      )
    })

    it('should reject invalid API name', async () => {
      const response = await request(app)
        .post('/api/diagnostics/api-status')
        .send({ api: 'invalidApi', status: 'success' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Invalid API name')
    })

    it('should reject invalid status', async () => {
      const response = await request(app)
        .post('/api/diagnostics/api-status')
        .send({ api: 'openWeatherMap', status: 'invalid' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Invalid status')
    })

    it('should require api parameter', async () => {
      const response = await request(app)
        .post('/api/diagnostics/api-status')
        .send({ status: 'success' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Missing required field: api')
    })

    it('should require status parameter', async () => {
      const response = await request(app)
        .post('/api/diagnostics/api-status')
        .send({ api: 'openWeatherMap' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Missing required field: status')
    })
  })

  describe('Buffer Flush History', () => {
    it('should include flush history in diagnostics response', async () => {
      const now = Date.now()
      flushScheduler.getFlushHistory.mockReturnValue([
        { timestamp: now - 60000, count: 10, durationMs: 50 },
        { timestamp: now - 30000, count: 15, durationMs: 45 },
      ])

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.flushHistory).toBeDefined()
      expect(response.body.data.flushHistory).toHaveLength(2)
    })

    it('should return flush timestamps in history', async () => {
      const now = Date.now()
      flushScheduler.getFlushHistory.mockReturnValue([
        { timestamp: now - 60000, count: 10, durationMs: 50 },
      ])

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.flushHistory[0].timestamp).toBe(now - 60000)
    })

    it('should return records flushed count for each flush', async () => {
      const now = Date.now()
      flushScheduler.getFlushHistory.mockReturnValue([
        { timestamp: now - 60000, count: 25, durationMs: 50 },
        { timestamp: now - 30000, count: 30, durationMs: 45 },
      ])

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.flushHistory[0].count).toBe(25)
      expect(response.body.data.flushHistory[1].count).toBe(30)
    })

    it('should return flush duration for each flush', async () => {
      const now = Date.now()
      flushScheduler.getFlushHistory.mockReturnValue([
        { timestamp: now - 60000, count: 10, durationMs: 55 },
      ])

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.flushHistory[0].durationMs).toBe(55)
    })

    it('should return empty array when no flushes have occurred', async () => {
      flushScheduler.getFlushHistory.mockReturnValue([])

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.flushHistory).toEqual([])
    })
  })

  describe('Database Statistics', () => {
    beforeEach(() => {
      // Default mock for database statistics
      historyDb.getDbStatistics.mockReturnValue({
        totalRecords: 0,
        recordsByMac: [],
        oldestTimestamp: null,
        newestTimestamp: null,
      })
    })

    it('should include total record count', async () => {
      historyDb.getDbStatistics.mockReturnValue({
        totalRecords: 12500,
        recordsByMac: [],
        oldestTimestamp: null,
        newestTimestamp: null,
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dbStats).toBeDefined()
      expect(response.body.data.dbStats.totalRecords).toBe(12500)
    })

    it('should include records per sensor', async () => {
      historyDb.getDbStatistics.mockReturnValue({
        totalRecords: 15000,
        recordsByMac: [
          { mac: 'aa:bb:cc:dd:ee:01', count: 10000 },
          { mac: 'aa:bb:cc:dd:ee:02', count: 5000 },
        ],
        oldestTimestamp: null,
        newestTimestamp: null,
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dbStats.recordsByMac).toEqual([
        { mac: 'aa:bb:cc:dd:ee:01', count: 10000 },
        { mac: 'aa:bb:cc:dd:ee:02', count: 5000 },
      ])
    })

    it('should include storage growth rate (MB/day estimate)', async () => {
      const now = Date.now()
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000

      historyDb.getDbStatistics.mockReturnValue({
        totalRecords: 15000,
        recordsByMac: [],
        oldestTimestamp: tenDaysAgo,
        newestTimestamp: now,
      })

      // Mock DB size of 10 MB (10 * 1024 * 1024 bytes)
      const mockDb = {
        pragma: jest.fn().mockImplementation((query) => {
          if (query === 'page_count') return [{ page_count: 2560 }]
          if (query === 'page_size') return [{ page_size: 4096 }]
          return []
        }),
        prepare: jest.fn().mockReturnValue({
          get: jest.fn().mockReturnValue({ oldest_timestamp: tenDaysAgo }),
        }),
      }
      historyDb.getDb.mockReturnValue(mockDb)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dbStats.growthRatePerDay).toBeDefined()
      // 10 MB over 10 days = ~1 MB/day = ~1048576 bytes/day
      expect(response.body.data.dbStats.growthRatePerDay).toBeCloseTo(1048576, -4)
    })

    it('should return null growth rate when no data history', async () => {
      historyDb.getDbStatistics.mockReturnValue({
        totalRecords: 0,
        recordsByMac: [],
        oldestTimestamp: null,
        newestTimestamp: null,
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dbStats.growthRatePerDay).toBeNull()
    })

    it('should include last successful DB write timestamp', async () => {
      const lastWriteTime = Date.now() - 30000 // 30 seconds ago
      historyDb.getDbStatistics.mockReturnValue({
        totalRecords: 1000,
        recordsByMac: [],
        oldestTimestamp: Date.now() - 86400000,
        newestTimestamp: lastWriteTime,
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dbStats.lastWriteTime).toBe(lastWriteTime)
    })

    it('should handle database not open for statistics', async () => {
      historyDb.getDb.mockReturnValue(null)
      historyDb.getDbStatistics.mockImplementation(() => {
        throw new Error('Database not open')
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dbStats).toEqual({
        totalRecords: 0,
        recordsByMac: [],
        growthRatePerDay: null,
        lastWriteTime: null,
      })
    })
  })

  describe('Data Quality', () => {
    beforeEach(() => {
      // Default mock for data quality methods
      historyDb.getOutOfRangeCount.mockReturnValue(0)
      historyDb.getTodayMinMax.mockReturnValue({
        minTemperature: null,
        maxTemperature: null,
        minHumidity: null,
        maxHumidity: null,
      })
      historyDb.getReadingFrequency.mockReturnValue(0)
      historyDb.getDataGaps.mockReturnValue([])
    })

    it('should include data quality metrics in diagnostics response', async () => {
      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dataQuality).toBeDefined()
    })

    it('should include out-of-range readings count', async () => {
      historyDb.getOutOfRangeCount.mockReturnValue(5)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dataQuality.outOfRangeCount).toBe(5)
    })

    it('should include min/max values recorded today', async () => {
      historyDb.getTodayMinMax.mockReturnValue({
        minTemperature: 18.5,
        maxTemperature: 25.3,
        minHumidity: 30,
        maxHumidity: 70,
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dataQuality.todayMinMax).toEqual({
        minTemperature: 18.5,
        maxTemperature: 25.3,
        minHumidity: 30,
        maxHumidity: 70,
      })
    })

    it('should include reading frequency per sensor', async () => {
      historyDb.getReadingFrequency.mockImplementation((mac) => {
        if (mac === 'aa:bb:cc:dd:ee:01') return 60
        if (mac === 'aa:bb:cc:dd:ee:02') return 58
        return 0
      })

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01,aa:bb:cc:dd:ee:02' })

      expect(response.status).toBe(200)
      expect(response.body.data.dataQuality.readingFrequency).toBeDefined()
      expect(response.body.data.dataQuality.readingFrequency).toHaveLength(2)
      expect(response.body.data.dataQuality.readingFrequency[0]).toEqual({
        mac: 'aa:bb:cc:dd:ee:01',
        readingsPerHour: 60,
      })
    })

    it('should include data gaps detection per sensor', async () => {
      const now = Date.now()
      historyDb.getDataGaps.mockImplementation((mac) => {
        if (mac === 'aa:bb:cc:dd:ee:01') {
          return [
            {
              startTime: now - 600000,
              endTime: now - 300000,
              gapDurationMs: 300000,
            },
          ]
        }
        return []
      })

      const response = await request(app)
        .get('/api/diagnostics')
        .query({ macs: 'aa:bb:cc:dd:ee:01,aa:bb:cc:dd:ee:02' })

      expect(response.status).toBe(200)
      expect(response.body.data.dataQuality.dataGaps).toBeDefined()
      expect(
        response.body.data.dataQuality.dataGaps['aa:bb:cc:dd:ee:01']
      ).toHaveLength(1)
      expect(
        response.body.data.dataQuality.dataGaps['aa:bb:cc:dd:ee:02']
      ).toHaveLength(0)
    })

    it('should return empty data quality when no MACs provided', async () => {
      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dataQuality.readingFrequency).toEqual([])
      expect(response.body.data.dataQuality.dataGaps).toEqual({})
    })

    it('should handle database errors gracefully', async () => {
      historyDb.getOutOfRangeCount.mockImplementation(() => {
        throw new Error('Database error')
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.data.dataQuality).toEqual({
        outOfRangeCount: 0,
        todayMinMax: {
          minTemperature: null,
          maxTemperature: null,
          minHumidity: null,
          maxHumidity: null,
        },
        readingFrequency: [],
        dataGaps: {},
      })
    })
  })
})
