/**
 * Data Retention/Aggregation Service
 *
 * Implements downsampling of old data to reduce storage:
 * - Data older than 24h is downsampled to 5-min intervals
 * - Data older than 7d is downsampled to hourly intervals
 * - Calculates avg temperature, humidity, pressure; min battery
 */

/**
 * 5-minute interval in milliseconds
 */
const FIVE_MIN_MS = 5 * 60 * 1000

/**
 * 1-hour interval in milliseconds
 */
const ONE_HOUR_MS = 60 * 60 * 1000

/**
 * 24 hours in milliseconds
 */
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

/**
 * 7 days in milliseconds
 */
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Get all unique MAC addresses from the database
 * @param {import('./historyDb')} db - History database instance
 * @returns {string[]}
 */
const getUniqueMacs = (db) => {
  const rawDb = db.getDb()
  if (!rawDb) {
    return []
  }
  const rows = rawDb.prepare('SELECT DISTINCT mac FROM readings').all()
  return rows.map((row) => row.mac)
}

/**
 * Get bucket start timestamp for a given timestamp and interval
 * @param {number} timestamp
 * @param {number} intervalMs
 * @returns {number}
 */
const getBucketStart = (timestamp, intervalMs) =>
  Math.floor(timestamp / intervalMs) * intervalMs

/**
 * Calculate aggregated values from bucket readings
 * @param {Array<{temperature: number|null, humidity: number|null, pressure: number|null, battery: number|null}>} bucketReadings
 * @returns {{avgTemp: number|null, avgHumidity: number|null, avgPressure: number|null, battery: number|null}}
 */
const calculateAggregates = (bucketReadings) => {
  let tempSum = 0
  let tempCount = 0
  let humiditySum = 0
  let humidityCount = 0
  let pressureSum = 0
  let pressureCount = 0
  let minBattery = Infinity

  bucketReadings.forEach((reading) => {
    if (reading.temperature !== null) {
      tempSum += reading.temperature
      tempCount += 1
    }
    if (reading.humidity !== null) {
      humiditySum += reading.humidity
      humidityCount += 1
    }
    if (reading.pressure !== null) {
      pressureSum += reading.pressure
      pressureCount += 1
    }
    if (reading.battery !== null && reading.battery < minBattery) {
      minBattery = reading.battery
    }
  })

  return {
    avgTemp: tempCount > 0 ? tempSum / tempCount : null,
    avgHumidity: humidityCount > 0 ? humiditySum / humidityCount : null,
    avgPressure: pressureCount > 0 ? pressureSum / pressureCount : null,
    battery: minBattery === Infinity ? null : minBattery,
  }
}

/**
 * Aggregate readings into buckets of specified interval
 * @param {import('./historyDb')} db - History database instance
 * @param {string} mac - MAC address
 * @param {number} startTime - Start time (inclusive)
 * @param {number} endTime - End time (exclusive)
 * @param {number} intervalMs - Bucket interval in milliseconds
 */
const aggregateIntoBuckets = (db, mac, startTime, endTime, intervalMs) => {
  const rawDb = db.getDb()
  if (!rawDb) {
    return
  }

  // Get all readings in the time range
  const readings = rawDb
    .prepare(
      `
    SELECT id, timestamp, temperature, humidity, pressure, battery
    FROM readings
    WHERE mac = ? AND timestamp >= ? AND timestamp < ?
    ORDER BY timestamp ASC
  `
    )
    .all(mac, startTime, endTime)

  if (readings.length === 0) {
    return
  }

  // Group readings by bucket using reduce
  /** @type {Map<number, Array<{id: number, timestamp: number, temperature: number, humidity: number, pressure: number, battery: number}>>} */
  const buckets = readings.reduce((map, reading) => {
    const bucketStart = getBucketStart(reading.timestamp, intervalMs)
    if (!map.has(bucketStart)) {
      map.set(bucketStart, [])
    }
    map.get(bucketStart).push(reading)
    return map
  }, new Map())

  // Filter buckets that have more than one reading (need aggregation)
  const bucketsToAggregate = Array.from(buckets.entries()).filter(
    ([, bucketReadings]) => bucketReadings.length > 1
  )

  if (bucketsToAggregate.length === 0) {
    return
  }

  // Process in a transaction for atomicity
  const transaction = rawDb.transaction(() => {
    const insertStmt = rawDb.prepare(`
      INSERT INTO readings (mac, timestamp, temperature, humidity, pressure, battery)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const deleteStmt = rawDb.prepare('DELETE FROM readings WHERE id = ?')

    bucketsToAggregate.forEach(([bucketStart, bucketReadings]) => {
      // Calculate aggregates
      const { avgTemp, avgHumidity, avgPressure, battery } =
        calculateAggregates(bucketReadings)

      // Delete original readings
      bucketReadings.forEach((reading) => {
        deleteStmt.run(reading.id)
      })

      // Insert aggregated reading
      insertStmt.run(
        mac,
        bucketStart,
        avgTemp,
        avgHumidity,
        avgPressure,
        battery
      )
    })
  })

  transaction()
}

/**
 * Downsample readings older than 24h but newer than 7d to 5-minute intervals
 * @param {import('./historyDb')} db - History database instance
 * @param {number} startTime - Start time (inclusive)
 * @param {number} endTime - End time (exclusive)
 */
const downsampleTo5Min = (db, startTime, endTime) => {
  const macs = getUniqueMacs(db)
  macs.forEach((mac) => {
    aggregateIntoBuckets(db, mac, startTime, endTime, FIVE_MIN_MS)
  })
}

/**
 * Downsample readings older than 7d to hourly intervals
 * @param {import('./historyDb')} db - History database instance
 * @param {number} startTime - Start time (inclusive)
 * @param {number} endTime - End time (exclusive)
 */
const downsampleToHourly = (db, startTime, endTime) => {
  const macs = getUniqueMacs(db)
  macs.forEach((mac) => {
    aggregateIntoBuckets(db, mac, startTime, endTime, ONE_HOUR_MS)
  })
}

/**
 * Main aggregation function - applies all retention policies
 * @param {import('./historyDb')} db - History database instance
 */
const aggregateOldData = (db) => {
  const currentTime = Date.now()

  // First, downsample data older than 7 days to hourly
  // This must be done first so we don't re-process already hourly data
  const sevenDaysAgo = currentTime - SEVEN_DAYS_MS
  downsampleToHourly(db, 0, sevenDaysAgo)

  // Then, downsample data older than 24h but newer than 7d to 5-min
  const twentyFourHoursAgo = currentTime - TWENTY_FOUR_HOURS_MS
  downsampleTo5Min(db, sevenDaysAgo, twentyFourHoursAgo)
}

module.exports = {
  aggregateOldData,
  downsampleTo5Min,
  downsampleToHourly,
}
