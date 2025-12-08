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

  describe('insertReading', () => {
    it('should insert a single reading', () => {
      historyDb.open(testDbPath)
      const mac = 'aa:bb:cc:dd:ee:ff'
      const timestamp = Date.now()
      const temperature = 22.5
      const humidity = 45.3
      const pressure = 101325
      const battery = 2.95

      const result = historyDb.insertReading(
        mac,
        timestamp,
        temperature,
        humidity,
        pressure,
        battery
      )

      expect(result.changes).toBe(1)
      expect(result.lastInsertRowid).toBeGreaterThan(0)
    })

    it('should store reading with correct values', () => {
      historyDb.open(testDbPath)
      const mac = 'aa:bb:cc:dd:ee:ff'
      const timestamp = 1700000000000
      const temperature = 22.5
      const humidity = 45.3
      const pressure = 101325
      const battery = 2.95

      historyDb.insertReading(
        mac,
        timestamp,
        temperature,
        humidity,
        pressure,
        battery
      )

      const readings = historyDb.getReadings(
        mac,
        timestamp - 1000,
        timestamp + 1000
      )
      expect(readings).toHaveLength(1)
      expect(readings[0]).toMatchObject({
        mac,
        timestamp,
        temperature,
        humidity,
        pressure,
        battery,
      })
    })
  })

  describe('insertBatch', () => {
    it('should insert multiple readings at once', () => {
      historyDb.open(testDbPath)
      const readings = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000000000,
          temperature: 22.5,
          humidity: 45.3,
          pressure: 101325,
          battery: 2.95,
        },
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000001000,
          temperature: 22.6,
          humidity: 45.4,
          pressure: 101326,
          battery: 2.94,
        },
        {
          mac: '11:22:33:44:55:66',
          timestamp: 1700000000000,
          temperature: 18.0,
          humidity: 60.0,
          pressure: 101000,
          battery: 3.0,
        },
      ]

      const result = historyDb.insertBatch(readings)

      expect(result.totalChanges).toBe(3)
    })

    it('should insert all readings correctly', () => {
      historyDb.open(testDbPath)
      const mac = 'aa:bb:cc:dd:ee:ff'
      const baseTimestamp = 1700000000000
      const readings = [
        {
          mac,
          timestamp: baseTimestamp,
          temperature: 22.5,
          humidity: 45.3,
          pressure: 101325,
          battery: 2.95,
        },
        {
          mac,
          timestamp: baseTimestamp + 1000,
          temperature: 22.6,
          humidity: 45.4,
          pressure: 101326,
          battery: 2.94,
        },
      ]

      historyDb.insertBatch(readings)

      const storedReadings = historyDb.getReadings(
        mac,
        baseTimestamp - 1000,
        baseTimestamp + 2000
      )
      expect(storedReadings).toHaveLength(2)
    })

    it('should handle empty array', () => {
      historyDb.open(testDbPath)

      const result = historyDb.insertBatch([])

      expect(result.totalChanges).toBe(0)
    })
  })

  describe('getReadings', () => {
    beforeEach(() => {
      historyDb.open(testDbPath)
      // Insert test data
      const readings = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000000000,
          temperature: 22.0,
          humidity: 45.0,
          pressure: 101000,
          battery: 2.9,
        },
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000060000,
          temperature: 22.5,
          humidity: 45.5,
          pressure: 101100,
          battery: 2.9,
        },
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000120000,
          temperature: 23.0,
          humidity: 46.0,
          pressure: 101200,
          battery: 2.9,
        },
        {
          mac: '11:22:33:44:55:66',
          timestamp: 1700000000000,
          temperature: 18.0,
          humidity: 60.0,
          pressure: 100000,
          battery: 3.0,
        },
      ]
      historyDb.insertBatch(readings)
    })

    it('should query readings by MAC and time range', () => {
      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        1700000000000,
        1700000120000
      )

      expect(readings).toHaveLength(3)
    })

    it('should filter by time range correctly', () => {
      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        1700000050000,
        1700000070000
      )

      expect(readings).toHaveLength(1)
      expect(readings[0].timestamp).toBe(1700000060000)
    })

    it('should return data in ascending timestamp order', () => {
      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        1700000000000,
        1700000120000
      )

      expect(readings[0].timestamp).toBe(1700000000000)
      expect(readings[1].timestamp).toBe(1700000060000)
      expect(readings[2].timestamp).toBe(1700000120000)
    })

    it('should return empty array for non-existent MAC', () => {
      const readings = historyDb.getReadings(
        'ff:ff:ff:ff:ff:ff',
        1700000000000,
        1700000120000
      )

      expect(readings).toEqual([])
    })

    it('should return empty array for time range with no data', () => {
      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        1600000000000,
        1600000120000
      )

      expect(readings).toEqual([])
    })

    it('should only return readings for specified MAC', () => {
      const readings = historyDb.getReadings(
        '11:22:33:44:55:66',
        1700000000000,
        1700000120000
      )

      expect(readings).toHaveLength(1)
      expect(readings[0].mac).toBe('11:22:33:44:55:66')
    })
  })

  describe('getLatestReading', () => {
    beforeEach(() => {
      historyDb.open(testDbPath)
      // Insert test data
      const readings = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000000000,
          temperature: 22.0,
          humidity: 45.0,
          pressure: 101000,
          battery: 2.9,
        },
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000120000,
          temperature: 23.0,
          humidity: 46.0,
          pressure: 101200,
          battery: 2.85,
        },
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000060000,
          temperature: 22.5,
          humidity: 45.5,
          pressure: 101100,
          battery: 2.88,
        },
      ]
      historyDb.insertBatch(readings)
    })

    it('should return the most recent reading for a MAC', () => {
      const latest = historyDb.getLatestReading('aa:bb:cc:dd:ee:ff')

      expect(latest).toBeDefined()
      expect(latest.timestamp).toBe(1700000120000)
      expect(latest.temperature).toBe(23.0)
    })

    it('should return undefined for non-existent MAC', () => {
      const latest = historyDb.getLatestReading('ff:ff:ff:ff:ff:ff')

      expect(latest).toBeUndefined()
    })
  })

  describe('getTotalRecordCount', () => {
    it('should return 0 for empty database', () => {
      historyDb.open(testDbPath)

      const count = historyDb.getTotalRecordCount()

      expect(count).toBe(0)
    })

    it('should return correct count after inserting readings', () => {
      historyDb.open(testDbPath)
      const readings = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000000000,
          temperature: 22.0,
          humidity: 45.0,
          pressure: 101000,
          battery: 2.9,
        },
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000060000,
          temperature: 22.5,
          humidity: 45.5,
          pressure: 101100,
          battery: 2.9,
        },
        {
          mac: '11:22:33:44:55:66',
          timestamp: 1700000000000,
          temperature: 18.0,
          humidity: 60.0,
          pressure: 100000,
          battery: 3.0,
        },
      ]
      historyDb.insertBatch(readings)

      const count = historyDb.getTotalRecordCount()

      expect(count).toBe(3)
    })
  })

  describe('getRecordCountByMac', () => {
    beforeEach(() => {
      historyDb.open(testDbPath)
      const readings = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000000000,
          temperature: 22.0,
          humidity: 45.0,
          pressure: 101000,
          battery: 2.9,
        },
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000060000,
          temperature: 22.5,
          humidity: 45.5,
          pressure: 101100,
          battery: 2.9,
        },
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000120000,
          temperature: 23.0,
          humidity: 46.0,
          pressure: 101200,
          battery: 2.9,
        },
        {
          mac: '11:22:33:44:55:66',
          timestamp: 1700000000000,
          temperature: 18.0,
          humidity: 60.0,
          pressure: 100000,
          battery: 3.0,
        },
      ]
      historyDb.insertBatch(readings)
    })

    it('should return record counts grouped by MAC address', () => {
      const counts = historyDb.getRecordCountByMac()

      expect(counts).toEqual(
        expect.arrayContaining([
          { mac: 'aa:bb:cc:dd:ee:ff', count: 3 },
          { mac: '11:22:33:44:55:66', count: 1 },
        ])
      )
    })

    it('should return empty array for empty database', () => {
      // Close and recreate with fresh db
      historyDb.close()
      const emptyDbPath = path.join(
        os.tmpdir(),
        `ruuvi-test-empty-${Date.now()}.db`
      )
      historyDb.open(emptyDbPath)

      const counts = historyDb.getRecordCountByMac()

      expect(counts).toEqual([])

      // Cleanup
      historyDb.close()
      const filesToDelete = [
        emptyDbPath,
        `${emptyDbPath}-wal`,
        `${emptyDbPath}-shm`,
      ]
      filesToDelete.forEach((file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
        }
      })
    })
  })

  describe('getOldestTimestamp', () => {
    it('should return null for empty database', () => {
      historyDb.open(testDbPath)

      const oldest = historyDb.getOldestTimestamp()

      expect(oldest).toBeNull()
    })

    it('should return oldest timestamp from database', () => {
      historyDb.open(testDbPath)
      const readings = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000120000,
          temperature: 23.0,
          humidity: 46.0,
          pressure: 101200,
          battery: 2.9,
        },
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000000000, // oldest
          temperature: 22.0,
          humidity: 45.0,
          pressure: 101000,
          battery: 2.9,
        },
        {
          mac: '11:22:33:44:55:66',
          timestamp: 1700000060000,
          temperature: 18.0,
          humidity: 60.0,
          pressure: 100000,
          battery: 3.0,
        },
      ]
      historyDb.insertBatch(readings)

      const oldest = historyDb.getOldestTimestamp()

      expect(oldest).toBe(1700000000000)
    })
  })

  describe('getNewestTimestamp', () => {
    it('should return null for empty database', () => {
      historyDb.open(testDbPath)

      const newest = historyDb.getNewestTimestamp()

      expect(newest).toBeNull()
    })

    it('should return newest timestamp from database', () => {
      historyDb.open(testDbPath)
      const readings = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000000000,
          temperature: 22.0,
          humidity: 45.0,
          pressure: 101000,
          battery: 2.9,
        },
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000120000, // newest
          temperature: 23.0,
          humidity: 46.0,
          pressure: 101200,
          battery: 2.9,
        },
        {
          mac: '11:22:33:44:55:66',
          timestamp: 1700000060000,
          temperature: 18.0,
          humidity: 60.0,
          pressure: 100000,
          battery: 3.0,
        },
      ]
      historyDb.insertBatch(readings)

      const newest = historyDb.getNewestTimestamp()

      expect(newest).toBe(1700000120000)
    })
  })

  describe('getDbStatistics', () => {
    it('should return all database statistics', () => {
      historyDb.open(testDbPath)
      const readings = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000000000,
          temperature: 22.0,
          humidity: 45.0,
          pressure: 101000,
          battery: 2.9,
        },
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: 1700000060000,
          temperature: 22.5,
          humidity: 45.5,
          pressure: 101100,
          battery: 2.9,
        },
        {
          mac: '11:22:33:44:55:66',
          timestamp: 1700000000000,
          temperature: 18.0,
          humidity: 60.0,
          pressure: 100000,
          battery: 3.0,
        },
      ]
      historyDb.insertBatch(readings)

      const stats = historyDb.getDbStatistics()

      expect(stats).toEqual({
        totalRecords: 3,
        recordsByMac: expect.arrayContaining([
          { mac: 'aa:bb:cc:dd:ee:ff', count: 2 },
          { mac: '11:22:33:44:55:66', count: 1 },
        ]),
        oldestTimestamp: 1700000000000,
        newestTimestamp: 1700000060000,
      })
    })

    it('should return empty statistics for empty database', () => {
      historyDb.open(testDbPath)

      const stats = historyDb.getDbStatistics()

      expect(stats).toEqual({
        totalRecords: 0,
        recordsByMac: [],
        oldestTimestamp: null,
        newestTimestamp: null,
      })
    })
  })
})
