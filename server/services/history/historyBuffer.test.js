/**
 * Tests for In-Memory Buffer Service
 *
 * Tests that the buffer:
 * - Accumulates readings before flushing to database
 * - Returns correct count of buffered readings
 * - Flushes all readings to database and clears buffer
 * - Returns current buffered readings
 * - Optionally persists to tmpfs for service restart recovery
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

  describe('tmpfs buffer support', () => {
    let testTmpfsPath
    let originalEnv

    beforeEach(() => {
      // Save original env values
      originalEnv = {
        RUUVI_USE_TMPFS_BUFFER: process.env.RUUVI_USE_TMPFS_BUFFER,
        RUUVI_TMPFS_PATH: process.env.RUUVI_TMPFS_PATH,
      }

      // Create a unique test tmpfs path (using regular temp dir for testing)
      testTmpfsPath = path.join(
        os.tmpdir(),
        `ruuvi-tmpfs-test-${Date.now()}-${Math.random()}`
      )
      fs.mkdirSync(testTmpfsPath, { recursive: true })

      // Clear buffer
      historyBuffer.clear()
    })

    afterEach(() => {
      // Restore original env values
      if (originalEnv.RUUVI_USE_TMPFS_BUFFER === undefined) {
        delete process.env.RUUVI_USE_TMPFS_BUFFER
      } else {
        process.env.RUUVI_USE_TMPFS_BUFFER = originalEnv.RUUVI_USE_TMPFS_BUFFER
      }

      if (originalEnv.RUUVI_TMPFS_PATH === undefined) {
        delete process.env.RUUVI_TMPFS_PATH
      } else {
        process.env.RUUVI_TMPFS_PATH = originalEnv.RUUVI_TMPFS_PATH
      }

      // Clean up test tmpfs directory
      try {
        if (fs.existsSync(testTmpfsPath)) {
          fs.rmSync(testTmpfsPath, { recursive: true })
        }
      } catch {
        // Ignore cleanup errors
      }

      // Reset buffer configuration
      historyBuffer.configure({ useTmpfs: false, tmpfsPath: null })
      historyBuffer.clear()
    })

    it('should use tmpfs path when env var is set', () => {
      process.env.RUUVI_USE_TMPFS_BUFFER = 'true'
      process.env.RUUVI_TMPFS_PATH = testTmpfsPath

      // Configure buffer to use tmpfs
      historyBuffer.configure({
        useTmpfs: true,
        tmpfsPath: testTmpfsPath,
      })

      const config = historyBuffer.getConfig()
      expect(config.useTmpfs).toBe(true)
      expect(config.tmpfsPath).toBe(testTmpfsPath)
    })

    it('should fall back to memory when tmpfs is disabled', () => {
      process.env.RUUVI_USE_TMPFS_BUFFER = 'false'

      historyBuffer.configure({
        useTmpfs: false,
        tmpfsPath: null,
      })

      const config = historyBuffer.getConfig()
      expect(config.useTmpfs).toBe(false)

      // Add a reading - should work without tmpfs
      historyBuffer.addReading('aa:bb:cc:dd:ee:ff', {
        timestamp: Date.now(),
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      expect(historyBuffer.getBufferSize()).toBe(1)
    })

    it('should create buffer file in tmpfs path when enabled', () => {
      historyBuffer.configure({
        useTmpfs: true,
        tmpfsPath: testTmpfsPath,
      })

      const mac = 'aa:bb:cc:dd:ee:ff'
      historyBuffer.addReading(mac, {
        timestamp: Date.now(),
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      const bufferFilePath = path.join(testTmpfsPath, 'buffer.json')
      expect(fs.existsSync(bufferFilePath)).toBe(true)

      // Verify file contains the reading
      const fileContents = JSON.parse(fs.readFileSync(bufferFilePath, 'utf8'))
      expect(fileContents).toHaveLength(1)
      expect(fileContents[0].mac).toBe('aa:bb:cc:dd:ee:ff')
    })

    it('should load buffer from tmpfs file on startup if exists', () => {
      // Manually create a buffer file as if from previous run
      const bufferFilePath = path.join(testTmpfsPath, 'buffer.json')
      const previousReadings = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          timestamp: Date.now() - 60000,
          temperature: 21.0,
          humidity: 50.0,
          pressure: 101300,
          battery: 2.9,
        },
        {
          mac: '11:22:33:44:55:66',
          timestamp: Date.now() - 30000,
          temperature: 19.0,
          humidity: 55.0,
          pressure: 101400,
          battery: 2.85,
        },
      ]
      fs.writeFileSync(bufferFilePath, JSON.stringify(previousReadings))

      // Configure buffer with tmpfs - should load existing file
      historyBuffer.configure({
        useTmpfs: true,
        tmpfsPath: testTmpfsPath,
      })

      // Buffer should have loaded the previous readings
      expect(historyBuffer.getBufferSize()).toBe(2)
      const contents = historyBuffer.getBufferContents()
      expect(contents[0].temperature).toBe(21.0)
      expect(contents[1].temperature).toBe(19.0)
    })

    it('should handle corrupted tmpfs file gracefully', () => {
      // Create a corrupted buffer file
      const bufferFilePath = path.join(testTmpfsPath, 'buffer.json')
      fs.writeFileSync(bufferFilePath, 'not valid json{{{')

      // Configure buffer - should not throw, just start with empty buffer
      expect(() => {
        historyBuffer.configure({
          useTmpfs: true,
          tmpfsPath: testTmpfsPath,
        })
      }).not.toThrow()

      expect(historyBuffer.getBufferSize()).toBe(0)
    })

    it('should clear tmpfs file when buffer is cleared', () => {
      historyBuffer.configure({
        useTmpfs: true,
        tmpfsPath: testTmpfsPath,
      })

      historyBuffer.addReading('aa:bb:cc:dd:ee:ff', {
        timestamp: Date.now(),
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      const bufferFilePath = path.join(testTmpfsPath, 'buffer.json')
      expect(fs.existsSync(bufferFilePath)).toBe(true)

      historyBuffer.clear()

      // File should exist and be empty (we persist empty array on clear)
      expect(fs.existsSync(bufferFilePath)).toBe(true)
      const contents = JSON.parse(fs.readFileSync(bufferFilePath, 'utf8'))
      expect(contents).toEqual([])
    })

    it('should update tmpfs file on each reading addition', () => {
      historyBuffer.configure({
        useTmpfs: true,
        tmpfsPath: testTmpfsPath,
      })

      const bufferFilePath = path.join(testTmpfsPath, 'buffer.json')

      // Add first reading
      historyBuffer.addReading('aa:bb:cc:dd:ee:ff', {
        timestamp: Date.now(),
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      let fileContents = JSON.parse(fs.readFileSync(bufferFilePath, 'utf8'))
      expect(fileContents).toHaveLength(1)

      // Add second reading
      historyBuffer.addReading('11:22:33:44:55:66', {
        timestamp: Date.now(),
        temperature: 18.0,
        humidity: 60.0,
        pressure: 101500,
        battery: 3.0,
      })

      fileContents = JSON.parse(fs.readFileSync(bufferFilePath, 'utf8'))
      expect(fileContents).toHaveLength(2)
    })

    it('should handle non-existent tmpfs directory gracefully', () => {
      const nonExistentPath = path.join(testTmpfsPath, 'does-not-exist')

      // Should not throw when directory doesn't exist
      expect(() => {
        historyBuffer.configure({
          useTmpfs: true,
          tmpfsPath: nonExistentPath,
        })
      }).not.toThrow()

      // Should fall back to memory-only mode
      const config = historyBuffer.getConfig()
      expect(config.useTmpfs).toBe(false)
    })

    it('should clear tmpfs file after successful flush', () => {
      historyDb.open(testDbPath)

      historyBuffer.configure({
        useTmpfs: true,
        tmpfsPath: testTmpfsPath,
      })

      const bufferFilePath = path.join(testTmpfsPath, 'buffer.json')

      historyBuffer.addReading('aa:bb:cc:dd:ee:ff', {
        timestamp: Date.now(),
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 2.95,
      })

      expect(fs.existsSync(bufferFilePath)).toBe(true)
      let fileContents = JSON.parse(fs.readFileSync(bufferFilePath, 'utf8'))
      expect(fileContents).toHaveLength(1)

      // Flush to database
      historyBuffer.flush(historyDb)

      // tmpfs file should exist and be empty after flush
      expect(fs.existsSync(bufferFilePath)).toBe(true)
      fileContents = JSON.parse(fs.readFileSync(bufferFilePath, 'utf8'))
      expect(fileContents).toEqual([])

      historyDb.close()
    })
  })
})
