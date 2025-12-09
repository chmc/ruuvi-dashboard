/**
 * History API Routes
 *
 * Provides endpoints for fetching historical sensor data.
 */
const express = require('express')
const { createLogger } = require('../utils/logger')
const historyDb = require('../services/history/historyDb')

const log = createLogger('routes:history')

const router = express.Router()

/** Maximum number of data points to return for chart efficiency */
const MAX_POINTS = 500

/**
 * Parse time range string to milliseconds
 * @param {string} range - Time range (1h, 6h, 24h, 7d, 30d, all)
 * @returns {number} Duration in milliseconds, or -1 for 'all'
 */
const parseRange = (range) => {
  const ranges = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    all: -1,
  }
  return ranges[range] || ranges['24h']
}

/**
 * Downsample readings to reduce data points for charts
 * Uses simple averaging over intervals
 * @param {Array} readings - Array of readings
 * @param {number} maxPoints - Maximum number of points to return
 * @returns {Array} Downsampled readings
 */
const downsample = (readings, maxPoints) => {
  if (readings.length <= maxPoints) {
    return readings
  }

  const step = Math.ceil(readings.length / maxPoints)
  const result = []

  for (let i = 0; i < readings.length; i += step) {
    const chunk = readings.slice(i, Math.min(i + step, readings.length))

    // Use the middle point's timestamp and average the values
    const middleIndex = Math.floor(chunk.length / 2)
    const avgReading = {
      timestamp: chunk[middleIndex].timestamp,
      temperature:
        chunk.reduce((sum, r) => sum + r.temperature, 0) / chunk.length,
      humidity: chunk.reduce((sum, r) => sum + r.humidity, 0) / chunk.length,
      pressure: chunk.reduce((sum, r) => sum + r.pressure, 0) / chunk.length,
    }

    result.push(avgReading)
  }

  return result
}

/**
 * GET /api/ruuvi/history
 *
 * Fetch historical readings for a sensor.
 *
 * Query parameters:
 * - mac (required): MAC address of the sensor
 * - range (optional): Time range - 1h, 6h, 24h (default), 7d, 30d, all
 *
 * Response: Array of { timestamp, temperature, humidity, pressure }
 */
router.get('/history', (req, res) => {
  try {
    const { mac, range = '24h' } = req.query

    if (!mac) {
      return res.status(400).json({
        error: 'Missing required parameter: mac',
      })
    }

    // Normalize MAC address to lowercase
    const normalizedMac = mac.toLowerCase()

    // Calculate time range
    const now = Date.now()
    const rangeDuration = parseRange(range)
    const startTime = rangeDuration === -1 ? 0 : now - rangeDuration
    const endTime = now

    // Fetch readings from database
    const readings = historyDb.getReadings(normalizedMac, startTime, endTime)

    // Format response (exclude id, mac, battery for chart data)
    let formattedReadings = readings.map((r) => ({
      timestamp: r.timestamp,
      temperature: r.temperature,
      humidity: r.humidity,
      pressure: r.pressure,
    }))

    // Downsample if too many points
    formattedReadings = downsample(formattedReadings, MAX_POINTS)

    return res.json(formattedReadings)
  } catch (error) {
    log.error({ err: error }, 'Error fetching history')
    return res.status(500).json({
      error: 'Failed to fetch history data',
    })
  }
})

module.exports = router
