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
}
