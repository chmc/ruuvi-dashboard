/**
 * @jest-environment node
 */

const request = require('supertest')
const express = require('express')

// Mock dependencies before importing the route
jest.mock('../services/history/historyDb')
jest.mock('../services/history/historyBuffer')
jest.mock('../services/history/flushScheduler')

const historyDb = require('../services/history/historyDb')
const historyBuffer = require('../services/history/historyBuffer')
const flushScheduler = require('../services/history/flushScheduler')
const diagnosticsRouter = require('./diagnostics')

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
  })

  describe('GET /api/diagnostics', () => {
    it('should return system status', async () => {
      historyBuffer.getBufferSize.mockReturnValue(42)
      flushScheduler.getLastFlushTime.mockReturnValue(1700000000000)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('bufferSize')
      expect(response.body).toHaveProperty('lastFlushTime')
      expect(response.body).toHaveProperty('batteries')
      expect(response.body).toHaveProperty('dbSize')
      expect(response.body).toHaveProperty('uptime')
    })

    it('should include buffer size', async () => {
      historyBuffer.getBufferSize.mockReturnValue(150)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.bufferSize).toBe(150)
    })

    it('should include last flush time', async () => {
      const flushTime = Date.now() - 60000
      flushScheduler.getLastFlushTime.mockReturnValue(flushTime)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.lastFlushTime).toBe(flushTime)
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
      expect(response.body.batteries).toHaveLength(2)
      expect(response.body.batteries[0]).toEqual({
        mac: 'aa:bb:cc:dd:ee:01',
        voltage: 3.05,
        lastSeen: expect.any(Number),
      })
      expect(response.body.batteries[1]).toEqual({
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
      expect(response.body.batteries).toHaveLength(2)
      // Should get the latest reading from buffer (2905, not 2900)
      expect(response.body.batteries[0]).toEqual({
        mac: 'aa:bb:cc:dd:ee:01',
        voltage: 2905,
        lastSeen: bufferTimestamp,
      })
      expect(response.body.batteries[1]).toEqual({
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
      expect(response.body.batteries[0]).toEqual({
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
      expect(response.body.dbSize).toBe(1000 * 4096) // 4MB
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
      expect(response.body.oldestRecord).toBe(1600000000000)
    })

    it('should include uptime', async () => {
      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(typeof response.body.uptime).toBe('number')
      expect(response.body.uptime).toBeGreaterThanOrEqual(0)
    })

    it('should handle database not open gracefully', async () => {
      historyDb.isOpen.mockReturnValue(false)
      historyDb.getDb.mockReturnValue(null)

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(200)
      expect(response.body.dbSize).toBe(0)
      expect(response.body.oldestRecord).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      historyBuffer.getBufferSize.mockImplementation(() => {
        throw new Error('Buffer error')
      })

      const response = await request(app).get('/api/diagnostics')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        error: 'Failed to fetch diagnostics data',
      })
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
      expect(response.body).toEqual({
        success: true,
        flushedCount: 50,
        message: 'Buffer flushed successfully',
      })
    })

    it('should return zero count when buffer was empty', async () => {
      flushScheduler.forceFlush.mockReturnValue({ flushedCount: 0 })

      const response = await request(app).post('/api/diagnostics/flush')

      expect(response.status).toBe(200)
      expect(response.body.flushedCount).toBe(0)
      expect(response.body.success).toBe(true)
    })

    it('should handle flush when scheduler not running', async () => {
      flushScheduler.forceFlush.mockReturnValue(null)

      const response = await request(app).post('/api/diagnostics/flush')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
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
      expect(response.body).toEqual({
        error: 'Failed to flush buffer',
      })
    })
  })
})
