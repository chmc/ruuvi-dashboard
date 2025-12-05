/* eslint-disable global-require */
const fs = require('fs')
const path = require('path')
const os = require('os')

describe('HistoryDb', () => {
  let historyDb
  let testDbPath

  beforeEach(() => {
    // Create unique temp file for each test
    testDbPath = path.join(os.tmpdir(), `ruuvi-test-${Date.now()}.db`)

    // Clear module cache to get fresh instance
    jest.resetModules()
    historyDb = require('./historyDb')
  })

  afterEach(() => {
    // Close database and clean up
    if (historyDb.isOpen()) {
      historyDb.close()
    }

    // Remove test database file and WAL files
    const filesToDelete = [testDbPath, `${testDbPath}-wal`, `${testDbPath}-shm`]
    filesToDelete.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    })
  })

  describe('Database file creation', () => {
    it('should create database file when opened', () => {
      historyDb.open(testDbPath)

      expect(fs.existsSync(testDbPath)).toBe(true)
    })

    it('should create database in default location if no path provided', () => {
      const defaultPath = path.join(process.cwd(), 'server', 'ruuviHistory.db')

      // Open with default path
      historyDb.open()

      expect(historyDb.getDbPath()).toBe(defaultPath)

      // Clean up default path file
      historyDb.close()
      const filesToDelete = [
        defaultPath,
        `${defaultPath}-wal`,
        `${defaultPath}-shm`,
      ]
      filesToDelete.forEach((file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
        }
      })
    })

    it('should respect RUUVI_HISTORY_DB_PATH environment variable', () => {
      const envPath = path.join(os.tmpdir(), 'ruuvi-env-test.db')
      process.env.RUUVI_HISTORY_DB_PATH = envPath

      historyDb.open()

      expect(historyDb.getDbPath()).toBe(envPath)

      // Clean up
      historyDb.close()
      delete process.env.RUUVI_HISTORY_DB_PATH
      const filesToDelete = [envPath, `${envPath}-wal`, `${envPath}-shm`]
      filesToDelete.forEach((file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
        }
      })
    })
  })

  describe('Schema initialization', () => {
    it('should create readings table with correct columns', () => {
      historyDb.open(testDbPath)

      const tableInfo = historyDb.getTableInfo('readings')

      expect(tableInfo).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'id', type: 'INTEGER' }),
          expect.objectContaining({ name: 'mac', type: 'TEXT' }),
          expect.objectContaining({ name: 'timestamp', type: 'INTEGER' }),
          expect.objectContaining({ name: 'temperature', type: 'REAL' }),
          expect.objectContaining({ name: 'humidity', type: 'REAL' }),
          expect.objectContaining({ name: 'pressure', type: 'REAL' }),
          expect.objectContaining({ name: 'battery', type: 'REAL' }),
        ])
      )
    })

    it('should create index on mac and timestamp columns', () => {
      historyDb.open(testDbPath)

      const indexes = historyDb.getIndexes('readings')

      expect(indexes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'idx_readings_mac_timestamp' }),
        ])
      )
    })

    it('should have id column as primary key with autoincrement', () => {
      historyDb.open(testDbPath)

      const tableInfo = historyDb.getTableInfo('readings')
      const idColumn = tableInfo.find((col) => col.name === 'id')

      expect(idColumn.pk).toBe(1)
    })

    it('should have mac and timestamp columns as NOT NULL', () => {
      historyDb.open(testDbPath)

      const tableInfo = historyDb.getTableInfo('readings')
      const macColumn = tableInfo.find((col) => col.name === 'mac')
      const timestampColumn = tableInfo.find((col) => col.name === 'timestamp')

      expect(macColumn.notnull).toBe(1)
      expect(timestampColumn.notnull).toBe(1)
    })
  })

  describe('WAL mode', () => {
    it('should enable WAL journal mode', () => {
      historyDb.open(testDbPath)

      const journalMode = historyDb.getJournalMode()

      expect(journalMode.toLowerCase()).toBe('wal')
    })

    it('should set synchronous mode to NORMAL', () => {
      historyDb.open(testDbPath)

      const synchronousMode = historyDb.getSynchronousMode()

      // NORMAL = 1
      expect(synchronousMode).toBe(1)
    })
  })

  describe('Connection management', () => {
    it('should open connection successfully', () => {
      historyDb.open(testDbPath)

      expect(historyDb.isOpen()).toBe(true)
    })

    it('should close connection successfully', () => {
      historyDb.open(testDbPath)
      historyDb.close()

      expect(historyDb.isOpen()).toBe(false)
    })

    it('should handle multiple open calls gracefully', () => {
      historyDb.open(testDbPath)
      historyDb.open(testDbPath)

      expect(historyDb.isOpen()).toBe(true)
    })

    it('should handle close on already closed database', () => {
      historyDb.open(testDbPath)
      historyDb.close()

      // Should not throw
      expect(() => historyDb.close()).not.toThrow()
    })

    it('should throw error when accessing closed database', () => {
      historyDb.open(testDbPath)
      historyDb.close()

      expect(() => historyDb.getTableInfo('readings')).toThrow()
    })
  })
})
