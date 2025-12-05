/**
 * Trends API Routes
 *
 * Provides endpoints for fetching sensor trend data for dashboard arrows.
 */
const express = require('express')
const historyDb = require('../services/history/historyDb')

const router = express.Router()

/** Time window for trend comparison (30 minutes) */
const TREND_COMPARISON_WINDOW_MS = 30 * 60 * 1000

/** Search window around the target time (5 minutes each direction) */
const SEARCH_WINDOW_MS = 5 * 60 * 1000

/**
 * Thresholds for determining trend direction
 * Temperature: degrees Celsius
 * Humidity: percentage points
 */
const THRESHOLDS = {
  temperature: {
    significant: 1.0, // >= 1°C is rising/falling
    slight: 0.3, // >= 0.3°C is rising-slightly/falling-slightly
  },
  humidity: {
    significant: 3.0, // >= 3% is rising/falling
    slight: 1.0, // >= 1% is rising-slightly/falling-slightly
  },
}

/**
 * Calculate trend direction based on delta value
 * @param {number} delta - Change value
 * @param {{significant: number, slight: number}} threshold - Threshold values
 * @returns {'rising' | 'rising-slightly' | 'stable' | 'falling-slightly' | 'falling'}
 */
const getDirection = (delta, threshold) => {
  if (delta >= threshold.significant) {
    return 'rising'
  }
  if (delta >= threshold.slight) {
    return 'rising-slightly'
  }
  if (delta <= -threshold.significant) {
    return 'falling'
  }
  if (delta <= -threshold.slight) {
    return 'falling-slightly'
  }
  return 'stable'
}

/**
 * Calculate trend data for a single sensor
 * @param {string} mac - MAC address of the sensor
 * @param {number} now - Current timestamp
 * @returns {{mac: string, temperature: {direction: string, delta: number} | null, humidity: {direction: string, delta: number} | null}}
 */
const calculateTrend = (mac, now) => {
  // Get current/latest reading
  const currentReading = historyDb.getLatestReading(mac)

  if (!currentReading) {
    return {
      mac,
      temperature: null,
      humidity: null,
    }
  }

  // Get reading from approximately 30 minutes ago
  const targetTime = now - TREND_COMPARISON_WINDOW_MS
  const startTime = targetTime - SEARCH_WINDOW_MS
  const endTime = targetTime + SEARCH_WINDOW_MS

  const pastReadings = historyDb.getReadings(mac, startTime, endTime)

  // If no historical data, return stable with zero delta
  if (pastReadings.length === 0) {
    return {
      mac,
      temperature: { direction: 'stable', delta: 0 },
      humidity: { direction: 'stable', delta: 0 },
    }
  }

  // Find the reading closest to the target time
  const pastReading = pastReadings.reduce((closest, reading) => {
    const closestDiff = Math.abs(closest.timestamp - targetTime)
    const currentDiff = Math.abs(reading.timestamp - targetTime)
    return currentDiff < closestDiff ? reading : closest
  })

  // Calculate deltas
  const tempDelta = currentReading.temperature - pastReading.temperature
  const humidityDelta = currentReading.humidity - pastReading.humidity

  return {
    mac,
    temperature: {
      direction: getDirection(tempDelta, THRESHOLDS.temperature),
      delta: tempDelta,
    },
    humidity: {
      direction: getDirection(humidityDelta, THRESHOLDS.humidity),
      delta: humidityDelta,
    },
  }
}

/**
 * GET /api/ruuvi/trends
 *
 * Fetch trend data for configured sensors.
 *
 * Query parameters:
 * - macs (required): Comma-separated MAC addresses
 *
 * Response: Array of { mac, temperature: { direction, delta }, humidity: { direction, delta } }
 */
router.get('/trends', (req, res) => {
  try {
    const { macs } = req.query

    if (!macs) {
      return res.status(400).json({
        error: 'Missing required parameter: macs',
      })
    }

    // Parse and normalize MAC addresses
    const macList = macs.split(',').map((mac) => mac.trim().toLowerCase())

    const now = Date.now()

    // Calculate trends for each sensor
    const trends = macList.map((mac) => calculateTrend(mac, now))

    return res.json(trends)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching trends:', error)
    return res.status(500).json({
      error: 'Failed to fetch trends data',
    })
  }
})

module.exports = router
