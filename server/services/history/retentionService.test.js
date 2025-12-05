/**
 * Tests for Data Retention/Aggregation Service
 *
 * Tests downsampling of old data:
 * - Data older than 24h is downsampled to 5-min intervals
 * - Data older than 7d is downsampled to hourly intervals
 * - Aggregation calculates correct averages
 * - Original granular data is deleted after aggregation
 * - Aggregation is idempotent (safe to run multiple times)
 */
const fs = require('fs')
const path = require('path')
const historyDb = require('./historyDb')
const retentionService = require('./retentionService')

const TEST_DB_PATH = path.join(__dirname, 'test-retention.db')

/**
 * Helper to create a reading at a specific time
 * @param {string} mac
 * @param {number} timestamp
 * @param {number} temperature
 * @param {number} humidity
 * @param {number} pressure
 * @param {number} battery
 * @returns {{mac: string, timestamp: number, temperature: number, humidity: number, pressure: number, battery: number}}
 */
const createReading = (
  mac,
  timestamp,
  temperature,
  humidity = 50,
  pressure = 101325,
  battery = 3.0
) => ({
  mac,
  timestamp,
  temperature,
  humidity,
  pressure,
  battery,
})

/**
 * Helper to get current time
 * @returns {number}
 */
const now = () => Date.now()

/**
 * Helper to subtract hours from current time
 * @param {number} hours
 * @returns {number}
 */
const hoursAgo = (hours) => now() - hours * 60 * 60 * 1000

/**
 * Helper to subtract days from current time
 * @param {number} days
 * @returns {number}
 */
const daysAgo = (days) => now() - days * 24 * 60 * 60 * 1000

describe('retentionService', () => {
  beforeEach(() => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-wal`)
    }
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-shm`)
    }

    historyDb.open(TEST_DB_PATH)
  })

  afterEach(() => {
    historyDb.close()

    // Clean up test database files
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-wal`)
    }
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-shm`)
    }
  })

  describe('aggregateOldData', () => {
    it('should not modify data less than 24 hours old', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      const baseTime = hoursAgo(12) // 12 hours ago

      // Insert 10 readings at 1-min intervals (recent data)
      const readings = []
      for (let i = 0; i < 10; i += 1) {
        readings.push(
          createReading(mac, baseTime + i * 60 * 1000, 20 + i * 0.1)
        )
      }
      historyDb.insertBatch(readings)

      // Run aggregation
      retentionService.aggregateOldData(historyDb)

      // All readings should still exist
      const result = historyDb.getReadings(
        mac,
        baseTime - 1000,
        baseTime + 20 * 60 * 1000
      )
      expect(result.length).toBe(10)
    })

    it('should downsample data older than 24h to 5-min intervals', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      // Align to 5-minute bucket boundary
      const bucketStart =
        Math.floor(hoursAgo(30) / (5 * 60 * 1000)) * (5 * 60 * 1000)

      // Insert 10 readings at 1-min intervals (old data) - spans exactly 2 buckets
      const readings = []
      for (let i = 0; i < 10; i += 1) {
        readings.push(createReading(mac, bucketStart + i * 60 * 1000, 20 + i))
      }
      historyDb.insertBatch(readings)

      // Run aggregation
      retentionService.aggregateOldData(historyDb)

      // Should have 2 aggregated readings (10 mins = 2 x 5-min buckets)
      const result = historyDb.getReadings(
        mac,
        bucketStart - 1000,
        bucketStart + 20 * 60 * 1000
      )
      expect(result.length).toBe(2)
    })

    it('should calculate correct averages for temperature, humidity, and pressure', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      // Use a timestamp that aligns to a 5-minute bucket start
      const bucketStart =
        Math.floor(hoursAgo(30) / (5 * 60 * 1000)) * (5 * 60 * 1000)

      // Insert 5 readings in same 5-min bucket with known values
      const readings = [
        createReading(mac, bucketStart, 20, 50, 101000, 3.0),
        createReading(mac, bucketStart + 60 * 1000, 22, 52, 101200, 2.9),
        createReading(mac, bucketStart + 2 * 60 * 1000, 24, 54, 101400, 2.8),
        createReading(mac, bucketStart + 3 * 60 * 1000, 26, 56, 101600, 2.7),
        createReading(mac, bucketStart + 4 * 60 * 1000, 28, 58, 101800, 2.6),
      ]
      historyDb.insertBatch(readings)

      // Run aggregation
      retentionService.aggregateOldData(historyDb)

      // Should have 1 aggregated reading
      const result = historyDb.getReadings(
        mac,
        bucketStart - 1000,
        bucketStart + 10 * 60 * 1000
      )
      expect(result.length).toBe(1)

      // Check averages: temp avg = (20+22+24+26+28)/5 = 24
      expect(result[0].temperature).toBeCloseTo(24, 1)
      // Humidity avg = (50+52+54+56+58)/5 = 54
      expect(result[0].humidity).toBeCloseTo(54, 1)
      // Pressure avg = (101000+101200+101400+101600+101800)/5 = 101400
      expect(result[0].pressure).toBeCloseTo(101400, 0)
    })

    it('should use minimum battery value during aggregation', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      // Align to 5-minute bucket boundary
      const bucketStart =
        Math.floor(hoursAgo(30) / (5 * 60 * 1000)) * (5 * 60 * 1000)

      // Insert readings with varying battery levels (all in same bucket)
      const readings = [
        createReading(mac, bucketStart, 20, 50, 101000, 3.0),
        createReading(mac, bucketStart + 60 * 1000, 20, 50, 101000, 2.8),
        createReading(mac, bucketStart + 2 * 60 * 1000, 20, 50, 101000, 2.5), // lowest
        createReading(mac, bucketStart + 3 * 60 * 1000, 20, 50, 101000, 2.9),
        createReading(mac, bucketStart + 4 * 60 * 1000, 20, 50, 101000, 2.7),
      ]
      historyDb.insertBatch(readings)

      // Run aggregation
      retentionService.aggregateOldData(historyDb)

      // Should have 1 aggregated reading with minimum battery
      const result = historyDb.getReadings(
        mac,
        bucketStart - 1000,
        bucketStart + 10 * 60 * 1000
      )
      expect(result.length).toBe(1)
      expect(result[0].battery).toBeCloseTo(2.5, 1)
    })

    it('should delete original granular data after aggregation', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      const baseTime = hoursAgo(30) // 30 hours ago

      // Insert 10 readings at 1-min intervals
      const readings = []
      for (let i = 0; i < 10; i += 1) {
        readings.push(createReading(mac, baseTime + i * 60 * 1000, 20 + i))
      }
      historyDb.insertBatch(readings)

      // Count readings before aggregation
      const countBefore = historyDb.getReadings(
        mac,
        baseTime - 1000,
        baseTime + 20 * 60 * 1000
      ).length
      expect(countBefore).toBe(10)

      // Run aggregation
      retentionService.aggregateOldData(historyDb)

      // Should have fewer readings (aggregated)
      const countAfter = historyDb.getReadings(
        mac,
        baseTime - 1000,
        baseTime + 20 * 60 * 1000
      ).length
      expect(countAfter).toBeLessThan(countBefore)
    })

    it('should downsample data older than 7d to hourly intervals', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      const baseTime = daysAgo(10) // 10 days ago

      // Insert 120 readings at 1-min intervals (2 hours worth)
      const readings = []
      for (let i = 0; i < 120; i += 1) {
        readings.push(
          createReading(mac, baseTime + i * 60 * 1000, 20 + (i % 10) * 0.1)
        )
      }
      historyDb.insertBatch(readings)

      // Run aggregation
      retentionService.aggregateOldData(historyDb)

      // Should have 2 aggregated readings (120 mins = 2 hours)
      const result = historyDb.getReadings(
        mac,
        baseTime - 1000,
        baseTime + 180 * 60 * 1000
      )
      expect(result.length).toBe(2)
    })

    it('should be idempotent - safe to run multiple times', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      const baseTime = hoursAgo(30) // 30 hours ago

      // Insert 10 readings at 1-min intervals
      const readings = []
      for (let i = 0; i < 10; i += 1) {
        readings.push(createReading(mac, baseTime + i * 60 * 1000, 20 + i))
      }
      historyDb.insertBatch(readings)

      // Run aggregation multiple times
      retentionService.aggregateOldData(historyDb)
      const countAfterFirst = historyDb.getReadings(
        mac,
        baseTime - 1000,
        baseTime + 20 * 60 * 1000
      ).length

      retentionService.aggregateOldData(historyDb)
      const countAfterSecond = historyDb.getReadings(
        mac,
        baseTime - 1000,
        baseTime + 20 * 60 * 1000
      ).length

      retentionService.aggregateOldData(historyDb)
      const countAfterThird = historyDb.getReadings(
        mac,
        baseTime - 1000,
        baseTime + 20 * 60 * 1000
      ).length

      // Count should remain stable after first aggregation
      expect(countAfterSecond).toBe(countAfterFirst)
      expect(countAfterThird).toBe(countAfterFirst)
    })

    it('should handle multiple MACs independently', () => {
      const mac1 = 'aa:bb:cc:dd:ee:11'
      const mac2 = 'aa:bb:cc:dd:ee:22'
      // Align to 5-minute bucket boundary
      const bucketStart =
        Math.floor(hoursAgo(30) / (5 * 60 * 1000)) * (5 * 60 * 1000)

      // Insert readings for both MACs (10 readings = 2 x 5-min buckets)
      const readings = []
      for (let i = 0; i < 10; i += 1) {
        readings.push(createReading(mac1, bucketStart + i * 60 * 1000, 20 + i))
        readings.push(createReading(mac2, bucketStart + i * 60 * 1000, 25 + i))
      }
      historyDb.insertBatch(readings)

      // Run aggregation
      retentionService.aggregateOldData(historyDb)

      // Both MACs should be aggregated
      const result1 = historyDb.getReadings(
        mac1,
        bucketStart - 1000,
        bucketStart + 20 * 60 * 1000
      )
      const result2 = historyDb.getReadings(
        mac2,
        bucketStart - 1000,
        bucketStart + 20 * 60 * 1000
      )

      expect(result1.length).toBe(2)
      expect(result2.length).toBe(2)

      // Check that temperatures are different (not mixed up)
      expect(result1[0].temperature).toBeLessThan(result2[0].temperature)
    })
  })

  describe('downsampleTo5Min', () => {
    it('should aggregate readings into 5-minute buckets', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      // Align to 5-minute bucket boundary
      const bucketStart =
        Math.floor(hoursAgo(30) / (5 * 60 * 1000)) * (5 * 60 * 1000)

      // Insert 15 readings at 1-min intervals (should become 3 x 5-min buckets)
      const readings = []
      for (let i = 0; i < 15; i += 1) {
        readings.push(createReading(mac, bucketStart + i * 60 * 1000, 20))
      }
      historyDb.insertBatch(readings)

      const endTime = hoursAgo(24) // Process data older than 24h
      retentionService.downsampleTo5Min(historyDb, bucketStart - 1000, endTime)

      const result = historyDb.getReadings(
        mac,
        bucketStart - 1000,
        bucketStart + 20 * 60 * 1000
      )
      expect(result.length).toBe(3)
    })

    it('should use bucket start time as the timestamp for aggregated reading', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      // Use a timestamp that aligns to a 5-minute boundary
      const bucketStart =
        Math.floor(hoursAgo(30) / (5 * 60 * 1000)) * (5 * 60 * 1000)

      // Insert readings in same bucket
      const readings = [
        createReading(mac, bucketStart + 60 * 1000, 20), // 1 min into bucket
        createReading(mac, bucketStart + 2 * 60 * 1000, 22), // 2 min into bucket
        createReading(mac, bucketStart + 4 * 60 * 1000, 24), // 4 min into bucket
      ]
      historyDb.insertBatch(readings)

      const endTime = hoursAgo(24)
      retentionService.downsampleTo5Min(historyDb, bucketStart - 1000, endTime)

      const result = historyDb.getReadings(
        mac,
        bucketStart - 1000,
        bucketStart + 10 * 60 * 1000
      )
      expect(result.length).toBe(1)
      // Timestamp should be the bucket start
      expect(result[0].timestamp).toBe(bucketStart)
    })
  })

  describe('downsampleToHourly', () => {
    it('should aggregate readings into hourly buckets', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      const baseTime = daysAgo(10) // 10 days ago

      // Insert 180 readings at 1-min intervals (3 hours worth)
      const readings = []
      for (let i = 0; i < 180; i += 1) {
        readings.push(createReading(mac, baseTime + i * 60 * 1000, 20))
      }
      historyDb.insertBatch(readings)

      const endTime = daysAgo(7) // Process data older than 7 days
      retentionService.downsampleToHourly(historyDb, baseTime - 1000, endTime)

      const result = historyDb.getReadings(
        mac,
        baseTime - 1000,
        baseTime + 200 * 60 * 1000
      )
      expect(result.length).toBe(3)
    })

    it('should use hour start time as the timestamp for aggregated reading', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      // Use a timestamp that aligns to an hour boundary
      const hourStart =
        Math.floor(daysAgo(10) / (60 * 60 * 1000)) * (60 * 60 * 1000)

      // Insert readings in same hour
      const readings = [
        createReading(mac, hourStart + 10 * 60 * 1000, 20), // 10 min into hour
        createReading(mac, hourStart + 30 * 60 * 1000, 22), // 30 min into hour
        createReading(mac, hourStart + 55 * 60 * 1000, 24), // 55 min into hour
      ]
      historyDb.insertBatch(readings)

      const endTime = daysAgo(7)
      retentionService.downsampleToHourly(historyDb, hourStart - 1000, endTime)

      const result = historyDb.getReadings(
        mac,
        hourStart - 1000,
        hourStart + 120 * 60 * 1000
      )
      expect(result.length).toBe(1)
      // Timestamp should be the hour start
      expect(result[0].timestamp).toBe(hourStart)
    })
  })

  describe('edge cases', () => {
    it('should handle empty database gracefully', () => {
      // Should not throw
      expect(() => retentionService.aggregateOldData(historyDb)).not.toThrow()
    })

    it('should handle null values in readings', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      const baseTime = hoursAgo(30)

      // Insert readings with some null values
      const db = historyDb.getDb()
      db.prepare(
        'INSERT INTO readings (mac, timestamp, temperature, humidity, pressure, battery) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(mac, baseTime, 20, null, 101000, 3.0)
      db.prepare(
        'INSERT INTO readings (mac, timestamp, temperature, humidity, pressure, battery) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(mac, baseTime + 60 * 1000, 22, 50, null, 2.9)

      // Should not throw
      expect(() => retentionService.aggregateOldData(historyDb)).not.toThrow()
    })

    it('should handle readings exactly at boundary times', () => {
      const mac = 'aa:bb:cc:dd:ee:ff'
      const exactlyOneDayAgo = now() - 24 * 60 * 60 * 1000

      // Insert reading exactly at 24h boundary
      historyDb.insertReading(mac, exactlyOneDayAgo, 20, 50, 101000, 3.0)

      // Should not throw and should not aggregate this reading
      // (boundary readings typically belong to the more recent period)
      expect(() => retentionService.aggregateOldData(historyDb)).not.toThrow()
    })
  })
})
