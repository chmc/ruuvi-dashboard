/**
 * Tests for In-Memory Buffer Service
 *
 * Tests that the buffer:
 * - Accumulates readings before flushing to database
 * - Returns correct count of buffered readings
 * - Flushes all readings to database and clears buffer
 * - Returns current buffered readings
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const historyBuffer = require('./historyBuffer')
const historyDb = require('./historyDb')

describe('historyBuffer', () => {
  let testDbPath

  beforeEach(() => {
    // Create a unique test database path
    testDbPath = path.join(
      os.tmpdir(),
      `ruuvi-buffer-test-${Date.now()}-${Math.random()}.db`
    )

    // Clear the buffer before each test
    historyBuffer.clear()
  })

  afterEach(() => {
    // Close database if open
    if (historyDb.isOpen()) {
      historyDb.close()
    }

    // Clean up test database file
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath)
      }
      // Clean up WAL and SHM files if they exist
      if (fs.existsSync(`${testDbPath}-wal`)) {
        fs.unlinkSync(`${testDbPath}-wal`)
      }
      if (fs.existsSync(`${testDbPath}-shm`)) {
        fs.unlinkSync(`${testDbPath}-shm`)
      }
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('addReading', () => {
    it('should add a reading to the buffer', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      const data = {
        timestamp: Date.now(),
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      }

      historyBuffer.addReading(mac, data)

      expect(historyBuffer.getBufferSize()).toBe(1)
    })

    it('should add multiple readings to the buffer', () => {
      const mac1 = 'aa:bb:cc:dd:ee:ff'
      const mac2 = '11:22:33:44:55:66'

      historyBuffer.addReading(mac1, {
        timestamp: Date.now(),
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      historyBuffer.addReading(mac2, {
        timestamp: Date.now(),
        temperature: 18.0,
        humidity: 60.0,
        pressure: 101500,
        battery: 3.0,
      })

      historyBuffer.addReading(mac1, {
        timestamp: Date.now() + 1000,
        temperature: 22.6,
        humidity: 44.5,
        pressure: 101330,
        battery: 2.94,
      })

      expect(historyBuffer.getBufferSize()).toBe(3)
    })

    it('should normalize MAC address to lowercase', () => {
      const mac = 'AA:BB:CC:DD:EE:FF'
      const data = {
        timestamp: Date.now(),
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      }

      historyBuffer.addReading(mac, data)

      const contents = historyBuffer.getBufferContents()
      expect(contents[0].mac).toBe('aa:bb:cc:dd:ee:ff')
    })
  })

  describe('getBufferSize', () => {
    it('should return 0 for empty buffer', () => {
      expect(historyBuffer.getBufferSize()).toBe(0)
    })

    it('should return correct count after adding readings', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'

      for (let i = 0; i < 5; i++) {
        historyBuffer.addReading(mac, {
          timestamp: Date.now() + i * 1000,
          temperature: 20 + i,
          humidity: 40 + i,
          pressure: 101325,
          battery: 2.95,
        })
      }

      expect(historyBuffer.getBufferSize()).toBe(5)
    })
  })

  describe('getBufferContents', () => {
    it('should return empty array for empty buffer', () => {
      expect(historyBuffer.getBufferContents()).toEqual([])
    })

    it('should return all buffered readings', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      const timestamp = Date.now()

      historyBuffer.addReading(mac, {
        timestamp,
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      const contents = historyBuffer.getBufferContents()

      expect(contents).toHaveLength(1)
      expect(contents[0]).toEqual({
        mac: 'aa:bb:cc:dd:ee:ff',
        timestamp,
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })
    })

    it('should return readings from multiple sensors', () => {
      const mac1 = 'aa:bb:cc:dd:ee:ff'
      const mac2 = '11:22:33:44:55:66'
      const timestamp = Date.now()

      historyBuffer.addReading(mac1, {
        timestamp,
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      historyBuffer.addReading(mac2, {
        timestamp: timestamp + 100,
        temperature: 18.0,
        humidity: 60.0,
        pressure: 101500,
        battery: 3.0,
      })

      const contents = historyBuffer.getBufferContents()

      expect(contents).toHaveLength(2)
      expect(contents.some((r) => r.mac === 'aa:bb:cc:dd:ee:ff')).toBe(true)
      expect(contents.some((r) => r.mac === '11:22:33:44:55:66')).toBe(true)
    })
  })

  describe('flush', () => {
    beforeEach(() => {
      historyDb.open(testDbPath)
    })

    it('should write all readings to database', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      const timestamp = Date.now()

      historyBuffer.addReading(mac, {
        timestamp,
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      historyBuffer.addReading(mac, {
        timestamp: timestamp + 1000,
        temperature: 22.6,
        humidity: 44.8,
        pressure: 101330,
        battery: 2.94,
      })

      const result = historyBuffer.flush(historyDb)

      expect(result.flushedCount).toBe(2)

      // Verify data was written to database
      const readings = historyDb.getReadings(
        mac,
        timestamp - 1000,
        timestamp + 2000
      )
      expect(readings).toHaveLength(2)
      expect(readings[0].temperature).toBe(22.5)
      expect(readings[1].temperature).toBe(22.6)
    })

    it('should clear buffer after flush', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'

      historyBuffer.addReading(mac, {
        timestamp: Date.now(),
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      expect(historyBuffer.getBufferSize()).toBe(1)

      historyBuffer.flush(historyDb)

      expect(historyBuffer.getBufferSize()).toBe(0)
      expect(historyBuffer.getBufferContents()).toEqual([])
    })

    it('should handle empty buffer flush', () => {
      const result = historyBuffer.flush(historyDb)

      expect(result.flushedCount).toBe(0)
      expect(historyBuffer.getBufferSize()).toBe(0)
    })

    it('should flush readings from multiple sensors', () => {
      const mac1 = 'aa:bb:cc:dd:ee:ff'
      const mac2 = '11:22:33:44:55:66'
      const timestamp = Date.now()

      historyBuffer.addReading(mac1, {
        timestamp,
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      historyBuffer.addReading(mac2, {
        timestamp,
        temperature: 18.0,
        humidity: 60.0,
        pressure: 101500,
        battery: 3.0,
      })

      const result = historyBuffer.flush(historyDb)

      expect(result.flushedCount).toBe(2)

      // Verify both sensors' data was written
      const readings1 = historyDb.getReadings(
        mac1,
        timestamp - 1000,
        timestamp + 1000
      )
      const readings2 = historyDb.getReadings(
        mac2,
        timestamp - 1000,
        timestamp + 1000
      )

      expect(readings1).toHaveLength(1)
      expect(readings2).toHaveLength(1)
    })
  })

  describe('clear', () => {
    it('should clear all buffered readings', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'

      historyBuffer.addReading(mac, {
        timestamp: Date.now(),
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      expect(historyBuffer.getBufferSize()).toBe(1)

      historyBuffer.clear()

      expect(historyBuffer.getBufferSize()).toBe(0)
      expect(historyBuffer.getBufferContents()).toEqual([])
    })
  })
})
