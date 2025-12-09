/**
 * @jest-environment node
 */

const request = require('supertest')
const express = require('express')

// Mock historyDb before importing the route
jest.mock('../services/history/historyDb')

const historyDb = require('../services/history/historyDb')
const trendsRouter = require('./trends')

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/api/ruuvi', trendsRouter)
  return app
}

describe('Trends API Endpoint', () => {
  let app

  beforeEach(() => {
    jest.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /api/ruuvi/trends', () => {
    it('should return trend for each sensor', async () => {
      const now = Date.now()
      const thirtyMinAgo = now - 30 * 60 * 1000

      // Mock current readings
      historyDb.getLatestReading.mockImplementation((mac) => {
        if (mac === 'aa:bb:cc:dd:ee:01') {
          return {
            id: 2,
            mac: 'aa:bb:cc:dd:ee:01',
            timestamp: now,
            temperature: 22.0,
            humidity: 50.0,
            pressure: 101325,
            battery: 3.0,
          }
        }
        if (mac === 'aa:bb:cc:dd:ee:02') {
          return {
            id: 4,
            mac: 'aa:bb:cc:dd:ee:02',
            timestamp: now,
            temperature: 18.0,
            humidity: 65.0,
            pressure: 101325,
            battery: 2.9,
          }
        }
        return undefined
      })

      // Mock readings from 30 min ago
      historyDb.getReadings.mockImplementation((mac, startTime, endTime) => {
        if (mac === 'aa:bb:cc:dd:ee:01') {
          return [
            {
              id: 1,
              mac: 'aa:bb:cc:dd:ee:01',
              timestamp: thirtyMinAgo,
              temperature: 21.0,
              humidity: 48.0,
              pressure: 101325,
              battery: 3.0,
            },
          ]
        }
        if (mac === 'aa:bb:cc:dd:ee:02') {
          return [
            {
              id: 3,
              mac: 'aa:bb:cc:dd:ee:02',
              timestamp: thirtyMinAgo,
              temperature: 19.0,
              humidity: 60.0,
              pressure: 101325,
              battery: 2.9,
            },
          ]
        }
        return []
      })

      const response = await request(app)
        .get('/api/ruuvi/trends')
        .query({ macs: 'aa:bb:cc:dd:ee:01,aa:bb:cc:dd:ee:02' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)

      // Check first sensor - temperature rising (22 - 21 = +1)
      const sensor1 = response.body.data.find((t) => t.mac === 'aa:bb:cc:dd:ee:01')
      expect(sensor1).toBeDefined()
      expect(sensor1.temperature.direction).toBe('rising')
      expect(sensor1.temperature.delta).toBeCloseTo(1.0, 1)
      expect(sensor1.humidity.direction).toBe('rising-slightly')
      expect(sensor1.humidity.delta).toBeCloseTo(2.0, 1)

      // Check second sensor - temperature falling (18 - 19 = -1)
      const sensor2 = response.body.data.find((t) => t.mac === 'aa:bb:cc:dd:ee:02')
      expect(sensor2).toBeDefined()
      expect(sensor2.temperature.direction).toBe('falling')
      expect(sensor2.temperature.delta).toBeCloseTo(-1.0, 1)
      expect(sensor2.humidity.direction).toBe('rising')
      expect(sensor2.humidity.delta).toBeCloseTo(5.0, 1)
    })

    it('should calculate direction from 30-min comparison', async () => {
      const now = Date.now()

      historyDb.getLatestReading.mockReturnValue({
        id: 2,
        mac: 'aa:bb:cc:dd:ee:ff',
        timestamp: now,
        temperature: 22.0,
        humidity: 50.0,
        pressure: 101325,
        battery: 3.0,
      })

      historyDb.getReadings.mockReturnValue([
        {
          id: 1,
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: now - 30 * 60 * 1000,
          temperature: 21.0,
          humidity: 48.0,
          pressure: 101325,
          battery: 3.0,
        },
      ])

      await request(app)
        .get('/api/ruuvi/trends')
        .query({ macs: 'aa:bb:cc:dd:ee:ff' })

      // Verify getReadings was called with approximately 30 min time range
      expect(historyDb.getReadings).toHaveBeenCalled()
      const [mac, startTime, endTime] = historyDb.getReadings.mock.calls[0]
      expect(mac).toBe('aa:bb:cc:dd:ee:ff')

      // The query should look for readings around 30 min ago (with 5 min window)
      const timeDiff = now - startTime
      expect(timeDiff).toBeGreaterThan(25 * 60 * 1000) // At least 25 min ago
      expect(timeDiff).toBeLessThan(40 * 60 * 1000) // At most 40 min ago
    })

    it('should include delta value in trend response', async () => {
      const now = Date.now()

      historyDb.getLatestReading.mockReturnValue({
        id: 2,
        mac: 'aa:bb:cc:dd:ee:ff',
        timestamp: now,
        temperature: 25.5,
        humidity: 55.0,
        pressure: 101325,
        battery: 3.0,
      })

      historyDb.getReadings.mockReturnValue([
        {
          id: 1,
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: now - 30 * 60 * 1000,
          temperature: 23.0,
          humidity: 50.0,
          pressure: 101325,
          battery: 3.0,
        },
      ])

      const response = await request(app)
        .get('/api/ruuvi/trends')
        .query({ macs: 'aa:bb:cc:dd:ee:ff' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data[0].temperature.delta).toBeCloseTo(2.5, 1)
      expect(response.body.data[0].humidity.delta).toBeCloseTo(5.0, 1)
    })

    it('should return all configured sensors', async () => {
      const now = Date.now()

      historyDb.getLatestReading.mockReturnValue({
        id: 1,
        mac: 'aa:bb:cc:dd:ee:ff',
        timestamp: now,
        temperature: 22.0,
        humidity: 50.0,
        pressure: 101325,
        battery: 3.0,
      })

      historyDb.getReadings.mockReturnValue([])

      const response = await request(app).get('/api/ruuvi/trends').query({
        macs: 'aa:bb:cc:dd:ee:01,aa:bb:cc:dd:ee:02,aa:bb:cc:dd:ee:03',
      })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(3)
      expect(response.body.data.map((t) => t.mac)).toEqual([
        'aa:bb:cc:dd:ee:01',
        'aa:bb:cc:dd:ee:02',
        'aa:bb:cc:dd:ee:03',
      ])
    })

    it.each([
      { current: 25.0, past: 22.0, expected: 'rising' }, // +3.0
      { current: 22.5, past: 22.0, expected: 'rising-slightly' }, // +0.5
      { current: 22.0, past: 22.0, expected: 'stable' }, // 0.0
      { current: 21.5, past: 22.0, expected: 'falling-slightly' }, // -0.5
      { current: 19.0, past: 22.0, expected: 'falling' }, // -3.0
    ])(
      'should return $expected when temp changes from $past to $current',
      async ({ current, past, expected }) => {
        const now = Date.now()

        historyDb.getLatestReading.mockReturnValue({
          id: 2,
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: now,
          temperature: current,
          humidity: 50.0,
          pressure: 101325,
          battery: 3.0,
        })

        historyDb.getReadings.mockReturnValue([
          {
            id: 1,
            mac: 'aa:bb:cc:dd:ee:ff',
            timestamp: now - 30 * 60 * 1000,
            temperature: past,
            humidity: 50.0,
            pressure: 101325,
            battery: 3.0,
          },
        ])

        const response = await request(app)
          .get('/api/ruuvi/trends')
          .query({ macs: 'aa:bb:cc:dd:ee:ff' })

        expect(response.body.data[0].temperature.direction).toBe(expected)
      }
    )

    it('should handle sensor with no historical data', async () => {
      const now = Date.now()

      historyDb.getLatestReading.mockReturnValue({
        id: 1,
        mac: 'aa:bb:cc:dd:ee:ff',
        timestamp: now,
        temperature: 22.0,
        humidity: 50.0,
        pressure: 101325,
        battery: 3.0,
      })

      historyDb.getReadings.mockReturnValue([])

      const response = await request(app)
        .get('/api/ruuvi/trends')
        .query({ macs: 'aa:bb:cc:dd:ee:ff' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data[0].temperature.direction).toBe('stable')
      expect(response.body.data[0].temperature.delta).toBe(0)
      expect(response.body.data[0].humidity.direction).toBe('stable')
      expect(response.body.data[0].humidity.delta).toBe(0)
    })

    it('should handle sensor with no current data', async () => {
      historyDb.getLatestReading.mockReturnValue(undefined)
      historyDb.getReadings.mockReturnValue([])

      const response = await request(app)
        .get('/api/ruuvi/trends')
        .query({ macs: 'aa:bb:cc:dd:ee:ff' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data[0].temperature).toBeNull()
      expect(response.body.data[0].humidity).toBeNull()
    })

    it('should return 400 when no macs provided', async () => {
      const response = await request(app).get('/api/ruuvi/trends')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Missing required parameter: macs')
    })

    it('should normalize MAC addresses to lowercase', async () => {
      const now = Date.now()

      historyDb.getLatestReading.mockReturnValue({
        id: 1,
        mac: 'aa:bb:cc:dd:ee:ff',
        timestamp: now,
        temperature: 22.0,
        humidity: 50.0,
        pressure: 101325,
        battery: 3.0,
      })

      historyDb.getReadings.mockReturnValue([])

      await request(app)
        .get('/api/ruuvi/trends')
        .query({ macs: 'AA:BB:CC:DD:EE:FF' })

      expect(historyDb.getLatestReading).toHaveBeenCalledWith(
        'aa:bb:cc:dd:ee:ff'
      )
    })

    it('should handle database errors gracefully', async () => {
      historyDb.getLatestReading.mockImplementation(() => {
        throw new Error('Database error')
      })

      const response = await request(app)
        .get('/api/ruuvi/trends')
        .query({ macs: 'aa:bb:cc:dd:ee:ff' })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Failed to fetch trends data')
    })
  })
})
