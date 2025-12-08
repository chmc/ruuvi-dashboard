/**
 * SQLite History Database Service
 *
 * Provides persistent storage for RuuviTag sensor readings with:
 * - WAL mode for better concurrency and SD card protection
 * - Indexed queries by MAC address and timestamp
 * - Connection management for safe open/close operations
 */
const Database = require('better-sqlite3')
const path = require('path')

/** @type {import('better-sqlite3').Database | null} */
let db = null

/** @type {string} */
let currentDbPath = ''

/** @type {import('better-sqlite3').Statement | null} */
let insertStmt = null

/**
 * Default database path
 * @returns {string}
 */
const getDefaultDbPath = () => {
  if (process.env.RUUVI_HISTORY_DB_PATH) {
    return process.env.RUUVI_HISTORY_DB_PATH
  }
  return path.join(process.cwd(), 'server', 'ruuviHistory.db')
}

/**
 * Initialize the database schema
 */
const initializeSchema = () => {
  if (!db) {
    throw new Error('Database not open')
  }

  // Create readings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mac TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      temperature REAL,
      humidity REAL,
      pressure REAL,
      battery REAL
    )
  `)

  // Create index on mac and timestamp for efficient queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_readings_mac_timestamp
    ON readings (mac, timestamp)
  `)
}

/**
 * Configure database pragmas for performance and durability
 */
const configurePragmas = () => {
  if (!db) {
    throw new Error('Database not open')
  }

  // WAL mode for better write performance and crash recovery
  db.pragma('journal_mode = WAL')

  // NORMAL synchronous mode - balance between safety and speed
  // Good for SD card longevity
  db.pragma('synchronous = NORMAL')
}

/**
 * Open database connection
 * @param {string} [dbPath] - Optional path to database file
 */
const open = (dbPath) => {
  // If already open, close first
  if (db) {
    return
  }

  currentDbPath = dbPath || getDefaultDbPath()
  db = new Database(currentDbPath)

  configurePragmas()
  initializeSchema()
}

/**
 * Close database connection
 */
const close = () => {
  if (db) {
    db.close()
    db = null
    insertStmt = null
  }
}

/**
 * Check if database is open
 * @returns {boolean}
 */
const isOpen = () => db !== null

/**
 * Get current database path
 * @returns {string}
 */
const getDbPath = () => currentDbPath

/**
 * Get table information
 * @param {string} tableName
 * @returns {Array<{cid: number, name: string, type: string, notnull: number, dflt_value: any, pk: number}>}
 */
const getTableInfo = (tableName) => {
  if (!db) {
    throw new Error('Database not open')
  }
  return db.pragma(`table_info(${tableName})`)
}

/**
 * Get indexes for a table
 * @param {string} tableName
 * @returns {Array<{seq: number, name: string, unique: number, origin: string, partial: number}>}
 */
const getIndexes = (tableName) => {
  if (!db) {
    throw new Error('Database not open')
  }
  return db.pragma(`index_list(${tableName})`)
}

/**
 * Get journal mode
 * @returns {string}
 */
const getJournalMode = () => {
  if (!db) {
    throw new Error('Database not open')
  }
  const result = db.pragma('journal_mode')
  return result[0].journal_mode
}

/**
 * Get synchronous mode
 * @returns {number}
 */
const getSynchronousMode = () => {
  if (!db) {
    throw new Error('Database not open')
  }
  const result = db.pragma('synchronous')
  return result[0].synchronous
}

/**
 * Get the raw database instance (for advanced operations)
 * @returns {import('better-sqlite3').Database | null}
 */
const getDb = () => db

// ============================================================================
// Insert Methods
// ============================================================================

/**
 * Get or create the insert prepared statement
 * @returns {import('better-sqlite3').Statement}
 */
const getInsertStatement = () => {
  if (!db) {
    throw new Error('Database not open')
  }
  if (!insertStmt) {
    insertStmt = db.prepare(`
      INSERT INTO readings (mac, timestamp, temperature, humidity, pressure, battery)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
  }
  return insertStmt
}

/**
 * Insert a single reading
 * @param {string} mac - MAC address of the sensor
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {number} temperature - Temperature in Celsius
 * @param {number} humidity - Relative humidity percentage
 * @param {number} pressure - Atmospheric pressure in Pascals
 * @param {number} battery - Battery voltage
 * @returns {{changes: number, lastInsertRowid: number | bigint}}
 */
const insertReading = (
  mac,
  timestamp,
  temperature,
  humidity,
  pressure,
  battery
) => {
  const stmt = getInsertStatement()
  return stmt.run(mac, timestamp, temperature, humidity, pressure, battery)
}

/**
 * Insert multiple readings in a transaction
 * @param {Array<{mac: string, timestamp: number, temperature: number, humidity: number, pressure: number, battery: number}>} readings
 * @returns {{totalChanges: number}}
 */
const insertBatch = (readings) => {
  if (!db) {
    throw new Error('Database not open')
  }

  if (readings.length === 0) {
    return { totalChanges: 0 }
  }

  const stmt = getInsertStatement()
  const insertMany = db.transaction((items) => {
    const totalChanges = items.reduce((acc, reading) => {
      const result = stmt.run(
        reading.mac,
        reading.timestamp,
        reading.temperature,
        reading.humidity,
        reading.pressure,
        reading.battery
      )
      return acc + result.changes
    }, 0)
    return { totalChanges }
  })

  return insertMany(readings)
}

// ============================================================================
// Query Methods
// ============================================================================

/**
 * Get readings for a MAC address within a time range
 * @param {string} mac - MAC address of the sensor
 * @param {number} startTime - Start timestamp (inclusive)
 * @param {number} endTime - End timestamp (inclusive)
 * @returns {Array<{id: number, mac: string, timestamp: number, temperature: number, humidity: number, pressure: number, battery: number}>}
 */
const getReadings = (mac, startTime, endTime) => {
  if (!db) {
    throw new Error('Database not open')
  }

  const stmt = db.prepare(`
    SELECT id, mac, timestamp, temperature, humidity, pressure, battery
    FROM readings
    WHERE mac = ? AND timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp ASC
  `)

  return stmt.all(mac, startTime, endTime)
}

/**
 * Get the most recent reading for a MAC address
 * @param {string} mac - MAC address of the sensor
 * @returns {{id: number, mac: string, timestamp: number, temperature: number, humidity: number, pressure: number, battery: number} | undefined}
 */
const getLatestReading = (mac) => {
  if (!db) {
    throw new Error('Database not open')
  }

  const stmt = db.prepare(`
    SELECT id, mac, timestamp, temperature, humidity, pressure, battery
    FROM readings
    WHERE mac = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `)

  return stmt.get(mac)
}

// ============================================================================
// Statistics Methods
// ============================================================================

/**
 * Get total number of records in the database
 * @returns {number}
 */
const getTotalRecordCount = () => {
  if (!db) {
    throw new Error('Database not open')
  }

  const stmt = db.prepare('SELECT COUNT(*) as count FROM readings')
  const result = stmt.get()
  return result.count
}

/**
 * Get record counts grouped by MAC address
 * @returns {Array<{mac: string, count: number}>}
 */
const getRecordCountByMac = () => {
  if (!db) {
    throw new Error('Database not open')
  }

  const stmt = db.prepare(`
    SELECT mac, COUNT(*) as count
    FROM readings
    GROUP BY mac
    ORDER BY count DESC
  `)

  return stmt.all()
}

/**
 * Get oldest timestamp in the database
 * @returns {number | null}
 */
const getOldestTimestamp = () => {
  if (!db) {
    throw new Error('Database not open')
  }

  const stmt = db.prepare('SELECT MIN(timestamp) as oldest FROM readings')
  const result = stmt.get()
  return result?.oldest || null
}

/**
 * Get newest timestamp in the database
 * @returns {number | null}
 */
const getNewestTimestamp = () => {
  if (!db) {
    throw new Error('Database not open')
  }

  const stmt = db.prepare('SELECT MAX(timestamp) as newest FROM readings')
  const result = stmt.get()
  return result?.newest || null
}

/**
 * Get all database statistics in one call
 * @returns {{totalRecords: number, recordsByMac: Array<{mac: string, count: number}>, oldestTimestamp: number | null, newestTimestamp: number | null}}
 */
const getDbStatistics = () => {
  if (!db) {
    throw new Error('Database not open')
  }

  return {
    totalRecords: getTotalRecordCount(),
    recordsByMac: getRecordCountByMac(),
    oldestTimestamp: getOldestTimestamp(),
    newestTimestamp: getNewestTimestamp(),
  }
}

// ============================================================================
// Data Quality Methods
// ============================================================================

/**
 * Temperature range for RuuviTag sensors (Celsius)
 * RuuviTag can measure -40 to +85°C
 */
const TEMP_MIN = -40
const TEMP_MAX = 85

/**
 * Humidity range (percentage)
 */
const HUMIDITY_MIN = 0
const HUMIDITY_MAX = 100

/**
 * Gap threshold in milliseconds (5 minutes)
 */
const GAP_THRESHOLD_MS = 5 * 60 * 1000

/**
 * Get count of readings with out-of-range values
 * @returns {number}
 */
const getOutOfRangeCount = () => {
  if (!db) {
    throw new Error('Database not open')
  }

  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM readings
    WHERE temperature < ? OR temperature > ?
       OR humidity < ? OR humidity > ?
  `)

  const result = stmt.get(TEMP_MIN, TEMP_MAX, HUMIDITY_MIN, HUMIDITY_MAX)
  return result.count
}

/**
 * Get start of today (midnight) in milliseconds
 * @returns {number}
 */
const getStartOfToday = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

/**
 * Get min/max temperature and humidity for today
 * @param {string} [mac] - Optional MAC address to filter by
 * @returns {{minTemperature: number | null, maxTemperature: number | null, minHumidity: number | null, maxHumidity: number | null}}
 */
const getTodayMinMax = (mac) => {
  if (!db) {
    throw new Error('Database not open')
  }

  const startOfToday = getStartOfToday()

  let stmt
  let result

  if (mac) {
    stmt = db.prepare(`
      SELECT
        MIN(temperature) as minTemperature,
        MAX(temperature) as maxTemperature,
        MIN(humidity) as minHumidity,
        MAX(humidity) as maxHumidity
      FROM readings
      WHERE timestamp >= ? AND mac = ?
    `)
    result = stmt.get(startOfToday, mac)
  } else {
    stmt = db.prepare(`
      SELECT
        MIN(temperature) as minTemperature,
        MAX(temperature) as maxTemperature,
        MIN(humidity) as minHumidity,
        MAX(humidity) as maxHumidity
      FROM readings
      WHERE timestamp >= ?
    `)
    result = stmt.get(startOfToday)
  }

  return {
    minTemperature: result?.minTemperature ?? null,
    maxTemperature: result?.maxTemperature ?? null,
    minHumidity: result?.minHumidity ?? null,
    maxHumidity: result?.maxHumidity ?? null,
  }
}

/**
 * Get average reading frequency (readings per hour) for a specific MAC over a time period
 * @param {string} mac - MAC address
 * @param {number} [hours=1] - Number of hours to analyze
 * @returns {number} - Readings per hour
 */
const getReadingFrequency = (mac, hours = 1) => {
  if (!db) {
    throw new Error('Database not open')
  }

  const now = Date.now()
  const startTime = now - hours * 60 * 60 * 1000

  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM readings
    WHERE mac = ? AND timestamp >= ?
  `)

  const result = stmt.get(mac, startTime)
  const count = result?.count || 0

  return count / hours
}

/**
 * Detect gaps in data larger than the threshold (5 minutes by default)
 * @param {string} mac - MAC address
 * @param {number} [hours=1] - Number of hours to analyze
 * @returns {Array<{startTime: number, endTime: number, gapDurationMs: number}>}
 */
const getDataGaps = (mac, hours = 1) => {
  if (!db) {
    throw new Error('Database not open')
  }

  const now = Date.now()
  const startTime = now - hours * 60 * 60 * 1000

  const stmt = db.prepare(`
    SELECT timestamp
    FROM readings
    WHERE mac = ? AND timestamp >= ?
    ORDER BY timestamp ASC
  `)

  const readings = stmt.all(mac, startTime)

  if (readings.length < 2) {
    return []
  }

  const gaps = []

  for (let i = 1; i < readings.length; i += 1) {
    const prevTimestamp = readings[i - 1].timestamp
    const currTimestamp = readings[i].timestamp
    const gapDuration = currTimestamp - prevTimestamp

    if (gapDuration > GAP_THRESHOLD_MS) {
      gaps.push({
        startTime: prevTimestamp,
        endTime: currTimestamp,
        gapDurationMs: gapDuration,
      })
    }
  }

  return gaps
}

/**
 * Get all data quality metrics
 * @param {string} [mac] - Optional MAC address for per-sensor metrics
 * @param {number} [hours=1] - Number of hours to analyze for frequency and gaps
 * @returns {{outOfRangeCount: number, todayMinMax: {minTemperature: number | null, maxTemperature: number | null, minHumidity: number | null, maxHumidity: number | null}, readingFrequency: number | null, dataGaps: Array<{startTime: number, endTime: number, gapDurationMs: number}> | null}}
 */
const getDataQualityMetrics = (mac, hours = 1) => {
  if (!db) {
    throw new Error('Database not open')
  }

  const metrics = {
    outOfRangeCount: getOutOfRangeCount(),
    todayMinMax: getTodayMinMax(mac),
    readingFrequency: mac ? getReadingFrequency(mac, hours) : null,
    dataGaps: mac ? getDataGaps(mac, hours) : null,
  }

  return metrics
}

module.exports = {
  open,
  close,
  isOpen,
  getDbPath,
  getTableInfo,
  getIndexes,
  getJournalMode,
  getSynchronousMode,
  getDb,
  insertReading,
  insertBatch,
  getReadings,
  getLatestReading,
  getTotalRecordCount,
  getRecordCountByMac,
  getOldestTimestamp,
  getNewestTimestamp,
  getDbStatistics,
  // Data Quality Methods
  getOutOfRangeCount,
  getTodayMinMax,
  getReadingFrequency,
  getDataGaps,
  getDataQualityMetrics,
}
