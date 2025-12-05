/**
 * History Seeder Service
 *
 * Generates 90 days of realistic fake history data for development and testing.
 * Features:
 * - Realistic daily temperature patterns (cooler at night)
 * - Outdoor sensors have more temperature variation
 * - Humidity, pressure, and battery values with realistic ranges
 * - Only seeds when RUUVI_SEED_HISTORY=true and DB is empty
 */

/**
 * Duration constants
 */
const ONE_MINUTE_MS = 60 * 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const NINETY_DAYS_MS = 90 * ONE_DAY_MS

/**
 * Temperature constants
 */
const INDOOR_BASE_TEMP = 21 // Indoor baseline temperature
const OUTDOOR_BASE_TEMP = 10 // Outdoor baseline temperature (Finland average)
const INDOOR_DAILY_VARIATION = 2 // Indoor daily swing (degrees)
const OUTDOOR_DAILY_VARIATION = 8 // Outdoor daily swing (degrees)
const INDOOR_RANDOM_VARIATION = 0.5 // Indoor random noise
const OUTDOOR_RANDOM_VARIATION = 2 // Outdoor random noise

/**
 * Humidity constants
 */
const INDOOR_BASE_HUMIDITY = 45
const OUTDOOR_BASE_HUMIDITY = 70
const HUMIDITY_VARIATION = 15

/**
 * Pressure constants (in Pascals)
 */
const BASE_PRESSURE = 101325 // Standard atmospheric pressure
const PRESSURE_VARIATION = 3000 // Weather variation

/**
 * Battery constants
 */
const BATTERY_START = 3.1 // Starting battery voltage
const BATTERY_DECLINE_PER_DAY = 0.001 // Battery drain per day

/**
 * Check if the database is empty
 * @param {import('./historyDb')} db - History database instance
 * @returns {boolean}
 */
const isDatabaseEmpty = (db) => {
  const rawDb = db.getDb()
  if (!rawDb) {
    return true
  }
  const result = rawDb.prepare('SELECT COUNT(*) as count FROM readings').get()
  return result.count === 0
}

/**
 * Check if seeding should occur
 * @param {import('./historyDb')} db - History database instance
 * @returns {boolean}
 */
const shouldSeed = (db) => {
  const envValue = process.env.RUUVI_SEED_HISTORY
  if (!envValue || envValue.toLowerCase() !== 'true') {
    return false
  }
  return isDatabaseEmpty(db)
}

/**
 * Calculate temperature based on time of day with daily pattern
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {boolean} isOutdoor - Whether this is an outdoor sensor
 * @param {number} dayOffset - Days from start (for seasonal variation)
 * @returns {number}
 */
const calculateTemperature = (timestamp, isOutdoor, dayOffset) => {
  const date = new Date(timestamp)
  const hour = date.getHours()

  const baseTemp = isOutdoor ? OUTDOOR_BASE_TEMP : INDOOR_BASE_TEMP
  const dailyVariation = isOutdoor
    ? OUTDOOR_DAILY_VARIATION
    : INDOOR_DAILY_VARIATION
  const randomVariation = isOutdoor
    ? OUTDOOR_RANDOM_VARIATION
    : INDOOR_RANDOM_VARIATION

  // Daily temperature cycle: coldest at 4-5 AM, warmest at 2-3 PM
  // Using sine wave shifted to peak at hour 14-15
  const hourRadians = ((hour - 4) / 24) * 2 * Math.PI
  const dailyCycle = Math.sin(hourRadians) * dailyVariation

  // Add seasonal variation for outdoor (colder in winter months)
  let seasonalOffset = 0
  if (isOutdoor) {
    // Simulate seasonal variation based on day offset
    // Peak warmth in summer (day 45 = mid-summer), coldest in winter
    const seasonRadians = ((dayOffset - 45) / 90) * Math.PI
    seasonalOffset = Math.cos(seasonRadians) * 5
  }

  // Random variation
  const randomOffset = (Math.random() - 0.5) * 2 * randomVariation

  return baseTemp + dailyCycle + seasonalOffset + randomOffset
}

/**
 * Calculate humidity with realistic variation
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {boolean} isOutdoor - Whether this is an outdoor sensor
 * @returns {number}
 */
const calculateHumidity = (timestamp, isOutdoor) => {
  const date = new Date(timestamp)
  const hour = date.getHours()

  const baseHumidity = isOutdoor ? OUTDOOR_BASE_HUMIDITY : INDOOR_BASE_HUMIDITY

  // Humidity is typically higher at night and early morning
  const hourRadians = ((hour + 2) / 24) * 2 * Math.PI
  const dailyCycle = Math.cos(hourRadians) * 10

  // Random variation
  const randomOffset =
    (Math.random() - 0.5) * 2 * (isOutdoor ? HUMIDITY_VARIATION : 10)

  // Clamp to valid range
  const humidity = baseHumidity + dailyCycle + randomOffset
  return Math.max(0, Math.min(100, humidity))
}

/**
 * Calculate pressure with slow weather-like changes
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {number} dayOffset - Days from start
 * @returns {number}
 */
const calculatePressure = (timestamp, dayOffset) => {
  // Pressure changes slowly over days (weather fronts)
  const weatherCycle = Math.sin((dayOffset / 10) * Math.PI) * PRESSURE_VARIATION

  // Small random variation
  const randomOffset = (Math.random() - 0.5) * 500

  return BASE_PRESSURE + weatherCycle + randomOffset
}

/**
 * Calculate battery voltage (slowly declining)
 * @param {number} dayOffset - Days from start
 * @returns {number}
 */
const calculateBattery = (dayOffset) => {
  const decline = dayOffset * BATTERY_DECLINE_PER_DAY
  // Add tiny random variation
  const randomOffset = (Math.random() - 0.5) * 0.01
  return Math.max(2.1, BATTERY_START - decline + randomOffset)
}

/**
 * Generate readings for a single MAC address
 * @param {string} mac - MAC address
 * @param {boolean} isOutdoor - Whether this is an outdoor sensor
 * @param {number} startTime - Start timestamp
 * @param {number} endTime - End timestamp
 * @returns {Array<{mac: string, timestamp: number, temperature: number, humidity: number, pressure: number, battery: number}>}
 */
const generateReadingsForMac = (mac, isOutdoor, startTime, endTime) => {
  const readings = []
  let currentTime = startTime

  while (currentTime <= endTime) {
    const dayOffset = Math.floor((endTime - currentTime) / ONE_DAY_MS)

    readings.push({
      mac,
      timestamp: currentTime,
      temperature: calculateTemperature(currentTime, isOutdoor, dayOffset),
      humidity: calculateHumidity(currentTime, isOutdoor),
      pressure: calculatePressure(currentTime, dayOffset),
      battery: calculateBattery(90 - dayOffset), // Days since start
    })

    currentTime += ONE_MINUTE_MS
  }

  return readings
}

/**
 * Seed the database with 90 days of fake history data
 * @param {import('./historyDb')} db - History database instance
 * @param {string[]} macs - Array of MAC addresses to seed
 * @param {string|null} outdoorMac - MAC address of outdoor sensor (for different patterns)
 */
const seed = (db, macs, outdoorMac) => {
  if (!macs || macs.length === 0) {
    return
  }

  const endTime = Date.now()
  const startTime = endTime - NINETY_DAYS_MS

  macs.forEach((mac) => {
    const isOutdoor = mac === outdoorMac
    const readings = generateReadingsForMac(mac, isOutdoor, startTime, endTime)

    // Insert in batches to avoid memory issues
    const BATCH_SIZE = 1000
    for (let i = 0; i < readings.length; i += BATCH_SIZE) {
      const batch = readings.slice(i, i + BATCH_SIZE)
      db.insertBatch(batch)
    }
  })
}

/**
 * Seed the database if conditions are met
 * @param {import('./historyDb')} db - History database instance
 * @param {string[]} macs - Array of MAC addresses to seed
 * @param {string|null} outdoorMac - MAC address of outdoor sensor
 * @returns {boolean} - Whether seeding occurred
 */
const seedIfNeeded = (db, macs, outdoorMac) => {
  if (!shouldSeed(db)) {
    return false
  }

  seed(db, macs, outdoorMac)
  return true
}

module.exports = {
  shouldSeed,
  seed,
  seedIfNeeded,
}
