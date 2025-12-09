/**
 * @jest-environment node
 */

const request = require('supertest')
const express = require('express')

// Mock historyDb before importing the route
jest.mock('../services/history/historyDb')

const historyDb = require('../services/history/historyDb')
const historyRouter = require('./history')

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/api/ruuvi', historyRouter)
  return app
}

describe('History API Endpoint', () => {
  let app

  beforeEach(() => {
    jest.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /api/ruuvi/history', () => {
    it('should return 400 error for missing mac parameter', async () => {
      const response = await request(app).get('/api/ruuvi/history')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Missing required parameter: mac')
    })

    it('should return readings for a valid mac', async () => {
      const mockReadings = [
        {
          id: 1,
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000000000,
          temperature: 21.5,
          humidity: 45.2,
          pressure: 101325,
          battery: 3.1,
        },
        {
          id: 2,
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000060000,
          temperature: 21.6,
          humidity: 45.0,
          pressure: 101320,
          battery: 3.1,
        },
      ]

      historyDb.getReadings.mockReturnValue(mockReadings)

      const response = await request(app)
        .get('/api/ruuvi/history')
        .query({ mac: 'aa:bb:cc:dd:ee:ff' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([
        {
          timestamp: 1700000000000,
          temperature: 21.5,
          humidity: 45.2,
          pressure: 101325,
        },
        {
          timestamp: 1700000060000,
          temperature: 21.6,
          humidity: 45.0,
          pressure: 101320,
        },
      ])
    })

    it('should filter by range=1h', async () => {
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000

      historyDb.getReadings.mockReturnValue([])

      await request(app)
        .get('/api/ruuvi/history')
        .query({ mac: 'aa:bb:cc:dd:ee:ff', range: '1h' })

      expect(historyDb.getReadings).toHaveBeenCalledWith(
        'aa:bb:cc:dd:ee:ff',
        expect.any(Number),
        expect.any(Number)
      )

      // Verify the time range is approximately 1 hour
      const [, startTime, endTime] = historyDb.getReadings.mock.calls[0]
      expect(endTime - startTime).toBeCloseTo(60 * 60 * 1000, -3)
    })

    it('should filter by range=6h', async () => {
      historyDb.getReadings.mockReturnValue([])

      await request(app)
        .get('/api/ruuvi/history')
        .query({ mac: 'aa:bb:cc:dd:ee:ff', range: '6h' })

      const [, startTime, endTime] = historyDb.getReadings.mock.calls[0]
      expect(endTime - startTime).toBeCloseTo(6 * 60 * 60 * 1000, -3)
    })

    it('should filter by range=24h (default)', async () => {
      historyDb.getReadings.mockReturnValue([])

      await request(app)
        .get('/api/ruuvi/history')
        .query({ mac: 'aa:bb:cc:dd:ee:ff' })

      const [, startTime, endTime] = historyDb.getReadings.mock.calls[0]
      expect(endTime - startTime).toBeCloseTo(24 * 60 * 60 * 1000, -3)
    })

    it('should filter by range=7d', async () => {
      historyDb.getReadings.mockReturnValue([])

      await request(app)
        .get('/api/ruuvi/history')
        .query({ mac: 'aa:bb:cc:dd:ee:ff', range: '7d' })

      const [, startTime, endTime] = historyDb.getReadings.mock.calls[0]
      expect(endTime - startTime).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3)
    })

    it('should filter by range=30d', async () => {
      historyDb.getReadings.mockReturnValue([])

      await request(app)
        .get('/api/ruuvi/history')
        .query({ mac: 'aa:bb:cc:dd:ee:ff', range: '30d' })

      const [, startTime, endTime] = historyDb.getReadings.mock.calls[0]
      expect(endTime - startTime).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -3)
    })

    it('should filter by range=all', async () => {
      historyDb.getReadings.mockReturnValue([])

      await request(app)
        .get('/api/ruuvi/history')
        .query({ mac: 'aa:bb:cc:dd:ee:ff', range: 'all' })

      const [, startTime] = historyDb.getReadings.mock.calls[0]
      // For 'all', start time should be 0 (epoch start)
      expect(startTime).toBe(0)
    })

    it('should normalize mac address to lowercase', async () => {
      historyDb.getReadings.mockReturnValue([])

      await request(app)
        .get('/api/ruuvi/history')
        .query({ mac: 'AA:BB:CC:DD:EE:FF' })

      expect(historyDb.getReadings).toHaveBeenCalledWith(
        'aa:bb:cc:dd:ee:ff',
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should downsample response when too many points', async () => {
      // Generate 1000 readings (more than the max ~500 points)
      const mockReadings = []
      const startTime = Date.now() - 24 * 60 * 60 * 1000
      for (let i = 0; i < 1000; i++) {
        mockReadings.push({
          id: i,
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: startTime + i * 60000,
          temperature: 20 + Math.sin(i / 100) * 2,
          humidity: 45 + Math.cos(i / 100) * 5,
          pressure: 101325,
          battery: 3.0,
        })
      }

      historyDb.getReadings.mockReturnValue(mockReadings)

      const response = await request(app)
        .get('/api/ruuvi/history')
        .query({ mac: 'aa:bb:cc:dd:ee:ff' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      // Should be downsampled to ~500 points or less
      expect(response.body.data.length).toBeLessThanOrEqual(500)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should return empty array for non-existent mac', async () => {
      historyDb.getReadings.mockReturnValue([])

      const response = await request(app)
        .get('/api/ruuvi/history')
        .query({ mac: 'non:ex:is:te:nt:00' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      historyDb.getReadings.mockImplementation(() => {
        throw new Error('Database error')
      })

      const response = await request(app)
        .get('/api/ruuvi/history')
        .query({ mac: 'aa:bb:cc:dd:ee:ff' })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Failed to fetch history data')
    })
  })
})
