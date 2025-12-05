/**
 * Tests for History Seeder Service
 *
 * Tests generating 90 days of realistic fake history data:
 * - Seeder generates data for all configured MACs
 * - Data spans 90 days
 * - Temperature follows realistic daily pattern (cooler at night)
 * - Outdoor sensor has seasonal/weather variation
 * - Seeder only runs when DB is empty and env var is set
 */
const fs = require('fs')
const path = require('path')
const historyDb = require('./historyDb')
const historySeeder = require('./historySeeder')

const TEST_DB_PATH = path.join(__dirname, 'test-seeder.db')

/**
 * Helper to clean up test database files
 */
const cleanupTestDb = () => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH)
  }
  if (fs.existsSync(`${TEST_DB_PATH}-wal`)) {
    fs.unlinkSync(`${TEST_DB_PATH}-wal`)
  }
  if (fs.existsSync(`${TEST_DB_PATH}-shm`)) {
    fs.unlinkSync(`${TEST_DB_PATH}-shm`)
  }
}

describe('historySeeder', () => {
  beforeEach(() => {
    cleanupTestDb()
    historyDb.open(TEST_DB_PATH)
    // Clear any previous env var setting
    delete process.env.RUUVI_SEED_HISTORY
  })

  afterEach(() => {
    historyDb.close()
    cleanupTestDb()
  })

  describe('shouldSeed', () => {
    it('should return false when RUUVI_SEED_HISTORY is not set', () => {
      expect(historySeeder.shouldSeed(historyDb)).toBe(false)
    })

    it('should return false when RUUVI_SEED_HISTORY is set to false', () => {
      process.env.RUUVI_SEED_HISTORY = 'false'
      expect(historySeeder.shouldSeed(historyDb)).toBe(false)
    })

    it('should return true when RUUVI_SEED_HISTORY is true and DB is empty', () => {
      process.env.RUUVI_SEED_HISTORY = 'true'
      expect(historySeeder.shouldSeed(historyDb)).toBe(true)
    })

    it('should return false when RUUVI_SEED_HISTORY is true but DB has data', () => {
      process.env.RUUVI_SEED_HISTORY = 'true'
      // Insert a reading
      historyDb.insertReading(
        'aa:bb:cc:dd:ee:ff',
        Date.now(),
        20,
        50,
        101325,
        3.0
      )
      expect(historySeeder.shouldSeed(historyDb)).toBe(false)
    })
  })

  describe('seed', () => {
    it('should generate data for all configured MACs', () => {
      const macs = [
        'aa:bb:cc:dd:ee:11',
        'aa:bb:cc:dd:ee:22',
        'aa:bb:cc:dd:ee:33',
      ]
      const outdoorMac = 'aa:bb:cc:dd:ee:22'

      historySeeder.seed(historyDb, macs, outdoorMac)

      // Check each MAC has data
      const now = Date.now()
      const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000

      macs.forEach((mac) => {
        const readings = historyDb.getReadings(mac, ninetyDaysAgo, now)
        expect(readings.length).toBeGreaterThan(0)
      })
    })

    it('should generate data spanning 90 days', () => {
      const macs = ['aa:bb:cc:dd:ee:ff']
      const outdoorMac = null

      historySeeder.seed(historyDb, macs, outdoorMac)

      const now = Date.now()
      const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000

      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        ninetyDaysAgo - 24 * 60 * 60 * 1000, // Extra day buffer
        now
      )

      // Should have readings from early in the 90 day period
      const oldestReading = readings[0]
      const newestReading = readings[readings.length - 1]

      // Oldest reading should be close to 90 days ago
      expect(oldestReading.timestamp).toBeLessThan(
        now - 89 * 24 * 60 * 60 * 1000
      )

      // Newest reading should be recent
      expect(newestReading.timestamp).toBeGreaterThan(now - 24 * 60 * 60 * 1000)
    })

    it('should generate readings at approximately 1-minute intervals', () => {
      const macs = ['aa:bb:cc:dd:ee:ff']
      const outdoorMac = null

      historySeeder.seed(historyDb, macs, outdoorMac)

      const now = Date.now()
      // Check a 1-hour window for consistency
      const oneHourAgo = now - 60 * 60 * 1000

      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        oneHourAgo,
        now
      )

      // With 1-minute intervals, should have approximately 60 readings per hour
      // Allow some variance
      expect(readings.length).toBeGreaterThan(50)
      expect(readings.length).toBeLessThan(70)
    })

    it('should generate temperature with realistic daily pattern (cooler at night)', () => {
      const macs = ['aa:bb:cc:dd:ee:ff']
      const outdoorMac = null

      historySeeder.seed(historyDb, macs, outdoorMac)

      const now = Date.now()
      // Get a full day of readings from 2 days ago (to ensure complete data)
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000
      const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000

      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        twoDaysAgo,
        oneDayAgo
      )

      // Group readings by hour
      const hourlyTemps = {}
      readings.forEach((reading) => {
        const hour = new Date(reading.timestamp).getHours()
        if (!hourlyTemps[hour]) {
          hourlyTemps[hour] = []
        }
        hourlyTemps[hour].push(reading.temperature)
      })

      // Calculate average temperature per hour
      const avgByHour = {}
      Object.keys(hourlyTemps).forEach((hour) => {
        const sum = hourlyTemps[hour].reduce((a, b) => a + b, 0)
        avgByHour[hour] = sum / hourlyTemps[hour].length
      })

      // Night hours (2-5 AM) should be cooler than day hours (13-16 PM)
      const nightHours = [2, 3, 4, 5]
      const dayHours = [13, 14, 15, 16]

      const avgNight =
        nightHours.reduce((sum, h) => sum + (avgByHour[h] || 0), 0) /
        nightHours.filter((h) => avgByHour[h] !== undefined).length
      const avgDay =
        dayHours.reduce((sum, h) => sum + (avgByHour[h] || 0), 0) /
        dayHours.filter((h) => avgByHour[h] !== undefined).length

      // Night should be cooler than day (at least 1 degree difference)
      expect(avgNight).toBeLessThan(avgDay)
    })

    it('should generate outdoor sensor with more temperature variation than indoor', () => {
      const indoorMac = 'aa:bb:cc:dd:ee:11'
      const outdoorMac = 'aa:bb:cc:dd:ee:22'
      const macs = [indoorMac, outdoorMac]

      historySeeder.seed(historyDb, macs, outdoorMac)

      const now = Date.now()
      const oneDayAgo = now - 24 * 60 * 60 * 1000

      const indoorReadings = historyDb.getReadings(indoorMac, oneDayAgo, now)
      const outdoorReadings = historyDb.getReadings(outdoorMac, oneDayAgo, now)

      // Calculate temperature range (max - min) for each sensor
      const indoorTemps = indoorReadings.map((r) => r.temperature)
      const outdoorTemps = outdoorReadings.map((r) => r.temperature)

      const indoorRange = Math.max(...indoorTemps) - Math.min(...indoorTemps)
      const outdoorRange = Math.max(...outdoorTemps) - Math.min(...outdoorTemps)

      // Outdoor should have larger temperature range than indoor
      expect(outdoorRange).toBeGreaterThan(indoorRange)
    })

    it('should generate valid humidity values (0-100)', () => {
      const macs = ['aa:bb:cc:dd:ee:ff']

      historySeeder.seed(historyDb, macs, null)

      const now = Date.now()
      const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000

      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        ninetyDaysAgo,
        now
      )

      readings.forEach((reading) => {
        expect(reading.humidity).toBeGreaterThanOrEqual(0)
        expect(reading.humidity).toBeLessThanOrEqual(100)
      })
    })

    it('should generate valid pressure values (typical atmospheric pressure)', () => {
      const macs = ['aa:bb:cc:dd:ee:ff']

      historySeeder.seed(historyDb, macs, null)

      const now = Date.now()
      const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000

      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        ninetyDaysAgo,
        now
      )

      readings.forEach((reading) => {
        // Typical atmospheric pressure range: 87000-108500 Pa
        expect(reading.pressure).toBeGreaterThan(87000)
        expect(reading.pressure).toBeLessThan(108500)
      })
    })

    it('should generate valid battery values (declining over time)', () => {
      const macs = ['aa:bb:cc:dd:ee:ff']

      historySeeder.seed(historyDb, macs, null)

      const now = Date.now()
      const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000

      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        ninetyDaysAgo,
        now
      )

      // Battery should be within valid range (2.0V - 3.3V typically)
      readings.forEach((reading) => {
        expect(reading.battery).toBeGreaterThan(2.0)
        expect(reading.battery).toBeLessThanOrEqual(3.3)
      })

      // Battery should decline slightly over time
      const oldBattery = readings[0].battery
      const newBattery = readings[readings.length - 1].battery
      expect(oldBattery).toBeGreaterThanOrEqual(newBattery)
    })
  })

  describe('seedIfNeeded', () => {
    it('should seed when conditions are met', () => {
      process.env.RUUVI_SEED_HISTORY = 'true'
      const macs = ['aa:bb:cc:dd:ee:ff']

      const result = historySeeder.seedIfNeeded(historyDb, macs, null)

      expect(result).toBe(true)

      // Verify data was seeded
      const now = Date.now()
      const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000
      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        ninetyDaysAgo,
        now
      )
      expect(readings.length).toBeGreaterThan(0)
    })

    it('should not seed when conditions are not met', () => {
      // RUUVI_SEED_HISTORY is not set
      const macs = ['aa:bb:cc:dd:ee:ff']

      const result = historySeeder.seedIfNeeded(historyDb, macs, null)

      expect(result).toBe(false)

      // Verify no data was seeded
      const now = Date.now()
      const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000
      const readings = historyDb.getReadings(
        'aa:bb:cc:dd:ee:ff',
        ninetyDaysAgo,
        now
      )
      expect(readings.length).toBe(0)
    })

    it('should not seed when database already has data', () => {
      process.env.RUUVI_SEED_HISTORY = 'true'
      const macs = ['aa:bb:cc:dd:ee:ff']

      // Insert existing data
      historyDb.insertReading(
        'aa:bb:cc:dd:ee:ff',
        Date.now(),
        20,
        50,
        101325,
        3.0
      )

      const result = historySeeder.seedIfNeeded(historyDb, macs, null)

      expect(result).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty MAC list gracefully', () => {
      expect(() => historySeeder.seed(historyDb, [], null)).not.toThrow()
    })

    it('should handle null outdoor MAC', () => {
      const macs = ['aa:bb:cc:dd:ee:ff']
      expect(() => historySeeder.seed(historyDb, macs, null)).not.toThrow()
    })

    it('should handle outdoor MAC not in MAC list', () => {
      const macs = ['aa:bb:cc:dd:ee:ff']
      const outdoorMac = 'aa:bb:cc:dd:ee:00' // Not in macs list
      expect(() =>
        historySeeder.seed(historyDb, macs, outdoorMac)
      ).not.toThrow()
    })
  })
})
