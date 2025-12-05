/**
 * @jest-environment node
 */

/**
 * History Integration Tests
 *
 * Tests the integration between the Ruuvi scanner and the history buffer service.
 * Verifies that scanner events properly trigger buffer additions with correct data format.
 */

const EventEmitter = require('events')
const historyBuffer = require('./historyBuffer')
const historyDb = require('./historyDb')

// Create mock scanner for testing
const createMockScanner = () => {
  const emitter = new EventEmitter()
  return {
    on: (event, callback) => emitter.on(event, callback),
    off: (event, callback) => emitter.off(event, callback),
    emit: (event, data) => emitter.emit(event, data),
    start: jest.fn(),
    stop: jest.fn(),
  }
}

describe('History Integration', () => {
  beforeEach(() => {
    historyBuffer.clear()
  })

  describe('Scanner events trigger buffer additions', () => {
    it('should add reading to buffer when scanner emits data event', () => {
      const mockScanner = createMockScanner()

      // Set up the handler (simulating what server/index.js will do)
      mockScanner.on('data', ({ mac, sensorData }) => {
        historyBuffer.addReading(mac, {
          timestamp: Date.now(),
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          pressure: sensorData.pressure,
          battery: sensorData.battery,
        })
      })

      // Emit a data event
      mockScanner.emit('data', {
        mac: 'aa:bb:cc:dd:ee:ff',
        sensorData: {
          temperature: 22.5,
          humidity: 45.0,
          pressure: 101325,
          battery: 3.0,
        },
      })

      expect(historyBuffer.getBufferSize()).toBe(1)
    })

    it('should add multiple readings when multiple data events occur', () => {
      const mockScanner = createMockScanner()

      mockScanner.on('data', ({ mac, sensorData }) => {
        historyBuffer.addReading(mac, {
          timestamp: Date.now(),
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          pressure: sensorData.pressure,
          battery: sensorData.battery,
        })
      })

      // Emit multiple data events
      mockScanner.emit('data', {
        mac: 'aa:bb:cc:dd:ee:ff',
        sensorData: {
          temperature: 22.5,
          humidity: 45.0,
          pressure: 101325,
          battery: 3.0,
        },
      })

      mockScanner.emit('data', {
        mac: '11:22:33:44:55:66',
        sensorData: {
          temperature: 18.2,
          humidity: 60.0,
          pressure: 101200,
          battery: 2.9,
        },
      })

      expect(historyBuffer.getBufferSize()).toBe(2)
    })
  })

  describe('Reading data is correctly formatted for buffer', () => {
    it('should store reading with all required fields', () => {
      const mockScanner = createMockScanner()
      const timestamp = Date.now()

      mockScanner.on('data', ({ mac, sensorData }) => {
        historyBuffer.addReading(mac, {
          timestamp,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          pressure: sensorData.pressure,
          battery: sensorData.battery,
        })
      })

      mockScanner.emit('data', {
        mac: 'aa:bb:cc:dd:ee:ff',
        sensorData: {
          temperature: 22.5,
          humidity: 45.0,
          pressure: 101325,
          battery: 3.0,
        },
      })

      const contents = historyBuffer.getBufferContents()
      expect(contents).toHaveLength(1)
      expect(contents[0]).toEqual({
        mac: 'aa:bb:cc:dd:ee:ff',
        timestamp,
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 3.0,
      })
    })

    it('should preserve numeric precision for temperature and humidity', () => {
      const mockScanner = createMockScanner()

      mockScanner.on('data', ({ mac, sensorData }) => {
        historyBuffer.addReading(mac, {
          timestamp: Date.now(),
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          pressure: sensorData.pressure,
          battery: sensorData.battery,
        })
      })

      mockScanner.emit('data', {
        mac: 'aa:bb:cc:dd:ee:ff',
        sensorData: {
          temperature: 22.567,
          humidity: 45.123,
          pressure: 101325.5,
          battery: 3.012,
        },
      })

      const contents = historyBuffer.getBufferContents()
      expect(contents[0].temperature).toBe(22.567)
      expect(contents[0].humidity).toBe(45.123)
      expect(contents[0].pressure).toBe(101325.5)
      expect(contents[0].battery).toBe(3.012)
    })
  })

  describe('Buffer receives readings with correct MAC normalization', () => {
    it('should normalize MAC addresses to lowercase', () => {
      const mockScanner = createMockScanner()

      mockScanner.on('data', ({ mac, sensorData }) => {
        historyBuffer.addReading(mac, {
          timestamp: Date.now(),
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          pressure: sensorData.pressure,
          battery: sensorData.battery,
        })
      })

      // Emit with uppercase MAC (scanner normalizes to lowercase, but test both paths)
      mockScanner.emit('data', {
        mac: 'AA:BB:CC:DD:EE:FF',
        sensorData: {
          temperature: 22.5,
          humidity: 45.0,
          pressure: 101325,
          battery: 3.0,
        },
      })

      const contents = historyBuffer.getBufferContents()
      expect(contents[0].mac).toBe('aa:bb:cc:dd:ee:ff')
    })

    it('should handle mixed-case MAC addresses', () => {
      const mockScanner = createMockScanner()

      mockScanner.on('data', ({ mac, sensorData }) => {
        historyBuffer.addReading(mac, {
          timestamp: Date.now(),
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          pressure: sensorData.pressure,
          battery: sensorData.battery,
        })
      })

      mockScanner.emit('data', {
        mac: 'Aa:Bb:Cc:Dd:Ee:Ff',
        sensorData: {
          temperature: 22.5,
          humidity: 45.0,
          pressure: 101325,
          battery: 3.0,
        },
      })

      const contents = historyBuffer.getBufferContents()
      expect(contents[0].mac).toBe('aa:bb:cc:dd:ee:ff')
    })
  })

  describe('Integration works with simulated scanner', () => {
    it('should work with simulated sensor data structure', () => {
      const mockScanner = createMockScanner()

      mockScanner.on('data', ({ mac, sensorData }) => {
        historyBuffer.addReading(mac, {
          timestamp: Date.now(),
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          pressure: sensorData.pressure,
          battery: sensorData.battery,
        })
      })

      // Simulated data structure matches what simulator produces
      const simulatedSensorData = {
        temperature: 21.5,
        humidity: 48.2,
        pressure: 101250,
        battery: 2.95,
        rssi: -65, // Extra field from simulator, should be ignored
        txPower: 4, // Extra field from simulator, should be ignored
      }

      mockScanner.emit('data', {
        mac: 'test:mac:00:00:00:01',
        sensorData: simulatedSensorData,
      })

      const contents = historyBuffer.getBufferContents()
      expect(contents).toHaveLength(1)
      // Should only include history-relevant fields
      expect(contents[0]).toEqual({
        mac: 'test:mac:00:00:00:01',
        timestamp: expect.any(Number),
        temperature: 21.5,
        humidity: 48.2,
        pressure: 101250,
        battery: 2.95,
      })
    })

    it('should handle rapid consecutive readings from simulator', () => {
      const mockScanner = createMockScanner()

      mockScanner.on('data', ({ mac, sensorData }) => {
        historyBuffer.addReading(mac, {
          timestamp: Date.now(),
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          pressure: sensorData.pressure,
          battery: sensorData.battery,
        })
      })

      // Simulate rapid data updates (as simulator does every second)
      for (let i = 0; i < 10; i += 1) {
        mockScanner.emit('data', {
          mac: 'test:mac:00:00:00:01',
          sensorData: {
            temperature: 21.0 + i * 0.1,
            humidity: 48.0,
            pressure: 101250,
            battery: 2.95,
          },
        })
      }

      expect(historyBuffer.getBufferSize()).toBe(10)
    })
  })
})

describe('History Integration with Database', () => {
  const testDbPath = '/tmp/history-integration-test.db'

  beforeEach(() => {
    historyBuffer.clear()
    if (historyDb.isOpen()) {
      historyDb.close()
    }
  })

  afterEach(() => {
    if (historyDb.isOpen()) {
      historyDb.close()
    }
    // Clean up test database
    // eslint-disable-next-line global-require
    const fs = require('fs')
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
    if (fs.existsSync(`${testDbPath}-wal`)) {
      fs.unlinkSync(`${testDbPath}-wal`)
    }
    if (fs.existsSync(`${testDbPath}-shm`)) {
      fs.unlinkSync(`${testDbPath}-shm`)
    }
  })

  it('should flush buffered readings to database', () => {
    historyDb.open(testDbPath)

    const mockScanner = createMockScanner()
    const timestamp = Date.now()

    mockScanner.on('data', ({ mac, sensorData }) => {
      historyBuffer.addReading(mac, {
        timestamp,
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        pressure: sensorData.pressure,
        battery: sensorData.battery,
      })
    })

    // Add multiple readings
    mockScanner.emit('data', {
      mac: 'aa:bb:cc:dd:ee:ff',
      sensorData: {
        temperature: 22.5,
        humidity: 45.0,
        pressure: 101325,
        battery: 3.0,
      },
    })

    mockScanner.emit('data', {
      mac: '11:22:33:44:55:66',
      sensorData: {
        temperature: 18.2,
        humidity: 60.0,
        pressure: 101200,
        battery: 2.9,
      },
    })

    expect(historyBuffer.getBufferSize()).toBe(2)

    // Flush to database
    const result = historyBuffer.flush(historyDb)
    expect(result.flushedCount).toBe(2)
    expect(historyBuffer.getBufferSize()).toBe(0)

    // Verify data in database
    const readings1 = historyDb.getReadings(
      'aa:bb:cc:dd:ee:ff',
      timestamp - 1000,
      timestamp + 1000
    )
    expect(readings1).toHaveLength(1)
    expect(readings1[0].temperature).toBe(22.5)

    const readings2 = historyDb.getReadings(
      '11:22:33:44:55:66',
      timestamp - 1000,
      timestamp + 1000
    )
    expect(readings2).toHaveLength(1)
    expect(readings2[0].temperature).toBe(18.2)
  })
})
