/**
 * Diagnostics API Routes
 *
 * Provides endpoints for system diagnostics and manual buffer flush.
 */
const express = require('express')
const fs = require('fs')
const historyDb = require('../services/history/historyDb')
const historyBuffer = require('../services/history/historyBuffer')
const flushScheduler = require('../services/history/flushScheduler')

const router = express.Router()

/** Server start time for uptime calculation */
const serverStartTime = Date.now()

/** Stale threshold in milliseconds (5 minutes) */
const STALE_THRESHOLD_MS = 5 * 60 * 1000

/**
 * Getter function to retrieve scanner health data
 * Set by the server when the scanner is initialized
 * @type {(() => Object.<string, {lastSeen: number, rssi: number | null}>) | null}
 */
let scannerHealthGetter = null

/**
 * Set the scanner health getter function
 * @param {(() => Object.<string, {lastSeen: number, rssi: number | null}>) | null} getter
 */
const setScannerHealthGetter = (getter) => {
  scannerHealthGetter = getter
}

/**
 * Get database size in bytes
 * @returns {number}
 */
const getDbSize = () => {
  const db = historyDb.getDb()
  if (!db) {
    return 0
  }

  try {
    const pageCount = db.pragma('page_count')[0].page_count
    const pageSize = db.pragma('page_size')[0].page_size
    return pageCount * pageSize
  } catch {
    return 0
  }
}

/**
 * Get timestamp of oldest record in database
 * @returns {number | null}
 */
const getOldestRecord = () => {
  const db = historyDb.getDb()
  if (!db) {
    return null
  }

  try {
    const stmt = db.prepare(
      'SELECT MIN(timestamp) as oldest_timestamp FROM readings'
    )
    const result = stmt.get()
    return result?.oldest_timestamp || null
  } catch {
    return null
  }
}

/**
 * Get the latest reading from buffer for a specific MAC address
 * @param {string} mac - MAC address to check
 * @returns {{battery: number, timestamp: number} | null}
 */
const getLatestBufferReading = (mac) => {
  const bufferContents = historyBuffer.getBufferContents()
  const macReadings = bufferContents.filter((r) => r.mac === mac)

  if (macReadings.length === 0) {
    return null
  }

  // Return the most recent reading (last in array, or find max timestamp)
  return macReadings.reduce((latest, current) =>
    current.timestamp > latest.timestamp ? current : latest
  )
}

/**
 * Get sensor health status based on last seen timestamp
 * @param {number | null} lastSeen - Last seen timestamp in milliseconds
 * @returns {'online' | 'stale' | 'offline'}
 */
const getSensorStatus = (lastSeen) => {
  if (lastSeen === null) {
    return 'offline'
  }

  const timeSinceLastSeen = Date.now() - lastSeen
  if (timeSinceLastSeen > STALE_THRESHOLD_MS) {
    return 'stale'
  }
  return 'online'
}

/**
 * Get sensor health data for all configured sensors
 * @param {string[]} macs - MAC addresses to check
 * @returns {Array<{mac: string, lastSeen: number | null, rssi: number | null, status: 'online' | 'stale' | 'offline'}>}
 */
const getSensorHealth = (macs) => {
  if (!macs || macs.length === 0) {
    return []
  }

  const healthData = scannerHealthGetter ? scannerHealthGetter() : {}

  return macs.map((mac) => {
    const normalizedMac = mac.trim().toLowerCase()
    const sensorHealth = healthData[normalizedMac]

    if (!sensorHealth) {
      return {
        mac: normalizedMac,
        lastSeen: null,
        rssi: null,
        status: 'offline',
      }
    }

    return {
      mac: normalizedMac,
      lastSeen: sensorHealth.lastSeen,
      rssi: sensorHealth.rssi,
      status: getSensorStatus(sensorHealth.lastSeen),
    }
  })
}

/**
 * Get disk space information for the root filesystem
 * @returns {{free: number, total: number}}
 */
const getDiskSpace = () => {
  try {
    // Use statfs (async version) synchronously is not available
    // Use fs.statfsSync which is available in Node.js 18.15.0+
    if (typeof fs.statfsSync === 'function') {
      const stats = fs.statfsSync('/')
      return {
        free: stats.bfree * stats.bsize,
        total: stats.blocks * stats.bsize,
      }
    }
    // Fallback for older Node.js versions
    return {
      free: 0,
      total: 0,
    }
  } catch {
    return {
      free: 0,
      total: 0,
    }
  }
}

/**
 * Get system resource information
 * @returns {{memory: {heapUsed: number, heapTotal: number, rss: number, external: number}, nodeVersion: string, disk: {free: number, total: number}}}
 */
const getSystemResources = () => {
  const memoryUsage = process.memoryUsage()
  const diskSpace = getDiskSpace()

  return {
    memory: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      rss: memoryUsage.rss,
      external: memoryUsage.external,
    },
    nodeVersion: process.version,
    disk: diskSpace,
  }
}

/**
 * Get battery levels for all configured sensors
 * Checks both database and in-memory buffer for the most recent data
 * @param {string[]} macs - MAC addresses to check
 * @returns {Array<{mac: string, voltage: number, lastSeen: number}>}
 */
const getBatteryLevels = (macs) => {
  if (!macs || macs.length === 0) {
    return []
  }

  return macs.map((mac) => {
    const normalizedMac = mac.trim().toLowerCase()

    // Get readings from both DB and buffer
    const dbReading = historyDb.getLatestReading(normalizedMac)
    const bufferReading = getLatestBufferReading(normalizedMac)

    // Determine which reading is more recent
    let bestReading = null

    if (dbReading && bufferReading) {
      // Use whichever is more recent
      bestReading =
        bufferReading.timestamp > dbReading.timestamp
          ? bufferReading
          : dbReading
    } else if (bufferReading) {
      bestReading = bufferReading
    } else if (dbReading) {
      bestReading = dbReading
    }

    if (!bestReading) {
      return {
        mac: normalizedMac,
        voltage: null,
        lastSeen: null,
      }
    }

    return {
      mac: normalizedMac,
      voltage: bestReading.battery,
      lastSeen: bestReading.timestamp,
    }
  })
}

/**
 * GET /api/diagnostics
 *
 * Fetch system diagnostics data.
 *
 * Query parameters:
 * - macs (optional): Comma-separated MAC addresses for battery levels and sensor health
 *
 * Response: {
 *   bufferSize: number,
 *   lastFlushTime: number | null,
 *   batteries: Array<{mac, voltage, lastSeen}>,
 *   sensorHealth: Array<{mac, lastSeen, rssi, status}>,
 *   dbSize: number,
 *   oldestRecord: number | null,
 *   uptime: number,
 *   systemResources: {memory: {heapUsed, heapTotal, rss, external}, nodeVersion, disk: {free, total}}
 * }
 */
router.get('/diagnostics', (req, res) => {
  try {
    const { macs } = req.query
    const macList = macs ? macs.split(',') : []

    const diagnostics = {
      bufferSize: historyBuffer.getBufferSize(),
      lastFlushTime: flushScheduler.getLastFlushTime(),
      batteries: getBatteryLevels(macList),
      sensorHealth: getSensorHealth(macList),
      dbSize: getDbSize(),
      oldestRecord: getOldestRecord(),
      uptime: Date.now() - serverStartTime,
      systemResources: getSystemResources(),
    }

    return res.json(diagnostics)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching diagnostics:', error)
    return res.status(500).json({
      error: 'Failed to fetch diagnostics data',
    })
  }
})

/**
 * POST /api/diagnostics/flush
 *
 * Trigger an immediate buffer flush.
 *
 * Response: { success: boolean, flushedCount: number, message: string }
 */
router.post('/diagnostics/flush', (req, res) => {
  try {
    const result = flushScheduler.forceFlush()
    const flushedCount = result?.flushedCount || 0

    return res.json({
      success: true,
      flushedCount,
      message: 'Buffer flushed successfully',
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error flushing buffer:', error)
    return res.status(500).json({
      error: 'Failed to flush buffer',
    })
  }
})

module.exports = router
module.exports.setScannerHealthGetter = setScannerHealthGetter
