/* eslint-disable no-use-before-define */
const express = require('express')
const NodeCache = require('node-cache')
const path = require('path')
const logger = require('./utils/logger')
const temperatureService = require('./services/temperature')
const energyPricesService = require('./services/energyPrices')
const sensorService = require('./services/sensor')
const simulatorUtils = require('./utils/simulator')
const storage = require('./storage')
const historyDb = require('./services/history/historyDb')
const historyBuffer = require('./services/history/historyBuffer')
const flushScheduler = require('./services/history/flushScheduler')
const shutdownHandler = require('./services/history/shutdownHandler')
const historySeeder = require('./services/history/historySeeder')
const historyRouter = require('./routes/history')
const trendsRouter = require('./routes/trends')
const diagnosticsRouter = require('./routes/diagnostics')
const weatherRouter = require('./routes/weather')
const {
  setScannerHealthGetter,
  setExternalApiStatusGetter,
} = require('./routes/diagnostics')
const externalApiStatus = require('./services/externalApiStatus')
require('dotenv').config()

// Only import ruuviScanner when not in test mode (requires native BLE module)
let ruuviScanner = null
if (!process.env.TEST && !process.env.SIMULATE) {
  // eslint-disable-next-line global-require
  ruuviScanner = require('./services/ruuvi/ruuviScanner')
}

// Store scanner instance for graceful shutdown
let scannerInstance = null

const app = express()
const port = process.env.PORT || 3001
const cache = new NodeCache()
const cacheKeys = {
  ruuvi: 'ruuvi',
  energyPrices: 'energyPrices',
  todayMinMax: 'todayMinMax',
}

app.use(express.json())

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')))
}

/**
 * Start the HTTP server
 * Called after database and services are initialized
 */
const startServer = () => {
  app.listen(port, () => logger.info({ port }, 'Server listening'))
}

app.get('/api/ruuvi', (req, res) => {
  res.send(cache.get(cacheKeys.ruuvi))
})

// Keep POST endpoint for backward compatibility (e.g., external data sources)
app.post('/api/ruuvi', (req, res) => {
  logger.info('POST /api/ruuvi received')
  try {
    const sensorDataCollection = sensorService.getSensorData(
      req.body,
      cache.get(cacheKeys.ruuvi),
      getConfigMacIds()
    )
    updateSensorCache(sensorDataCollection)
    res
      .status(200)
      .json({ message: 'Data received and processed successfully' })
  } catch (error) {
    logger.error({ err: error }, 'POST /api/ruuvi failed')
    res
      .status(500)
      .json({ error: 'An error occurred while processing the data' })
  }
})

app.get('/api/energyprices', async (req, res) => {
  logger.debug('Energy prices called')
  /** @type {EnergyPrices=} */
  let cachedEnergyPrices = cache.get(cacheKeys.energyPrices)

  if (!cachedEnergyPrices) {
    logger.debug('Energy prices not in cache, loading from store')
    const appStorage = await storage.loadOrDefaultSync()
    cachedEnergyPrices = {
      updatedAt: appStorage.todayEnergyPrices?.updatedAt,
      todayEnergyPrices: appStorage.todayEnergyPrices,
      tomorrowEnergyPrices: appStorage.tomorrowEnergyPrices,
    }
  }
  const energyPrices =
    await energyPricesService.getEnergyPrices(cachedEnergyPrices)
  cache.set(cacheKeys.energyPrices, energyPrices)

  const energyPricesForClient = {
    todayEnergyPrices: energyPrices.todayEnergyPrices?.data,
    tomorrowEnergyPrices: energyPrices.tomorrowEnergyPrices?.data,
  }
  res.send(energyPricesForClient)
})

app.get('/api/todayminmaxtemperature', async (req, res) => {
  res.json(cache.get(cacheKeys.todayMinMax) || null)
})

// History API routes
app.use('/api/ruuvi', historyRouter)

// Trends API routes
app.use('/api/ruuvi', trendsRouter)

// Diagnostics API routes
app.use('/api', diagnosticsRouter)

// Weather API routes (proxies OpenWeatherMap)
app.use('/api', weatherRouter)

// Wire up external API status to diagnostics route (always enabled)
setExternalApiStatusGetter(() => externalApiStatus.getStatus())

// Catch-all route to serve React app for any non-API routes (must be after API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'))
  })
}

/**
 * Update sensor data cache and temperature min/max
 * @param {SensorDataCollection} sensorDataCollection
 */
const updateSensorCache = (sensorDataCollection) => {
  cache.set(cacheKeys.ruuvi, sensorDataCollection)

  const todayminmaxtemperature = temperatureService.getTodayMinMaxTemperature(
    sensorDataCollection,
    cache.get(cacheKeys.todayMinMax)
  )
  if (todayminmaxtemperature) {
    cache.set(cacheKeys.todayMinMax, todayminmaxtemperature)
  }
}

/**
 * Add sensor reading to history buffer
 * @param {string} mac - MAC address of the sensor
 * @param {object} sensorData - Sensor data with temperature, humidity, pressure, batteryVoltage
 */
const addToHistoryBuffer = (mac, sensorData) => {
  historyBuffer.addReading(mac, {
    timestamp: Date.now(),
    temperature: sensorData.temperature,
    humidity: sensorData.humidity,
    pressure: sensorData.pressure,
    battery: sensorData.batteryVoltage,
  })
}

/**
 * Create flush callback for scheduler and shutdown handler
 * @returns {() => {flushedCount: number}}
 */
const createFlushCallback = () => () => {
  const result = historyBuffer.flush(historyDb)
  logger.debug({ flushedCount: result.flushedCount }, 'Buffer flushed')
  return result
}

/**
 * Initialize history services (database, scheduler, shutdown handler)
 */
const initializeHistoryServices = () => {
  logger.info('Initializing history services')

  // Open database
  historyDb.open()
  logger.info({ dbPath: historyDb.getDbPath() }, 'History database opened')

  // Check if seeding is needed
  const macs = getConfigMacIds() || []
  const outdoorMac = process.env.VITE_MAIN_OUTDOOR_RUUVITAG_MAC?.toLowerCase()
  if (historySeeder.seedIfNeeded(historyDb, macs, outdoorMac)) {
    logger.info('History database seeded with 90 days of data')
  }

  // Create flush callback
  const flushCallback = createFlushCallback()

  // Start flush scheduler
  const flushIntervalMs = flushScheduler.getDefaultIntervalMs()
  flushScheduler.start(flushIntervalMs, flushCallback)
  logger.info(
    { intervalSeconds: flushIntervalMs / 1000 },
    'Flush scheduler started'
  )

  // Register shutdown handler with flush callback
  // Scanner stop will be registered separately when scanner is created
  shutdownHandler.register(flushCallback)
  logger.info('Graceful shutdown handler registered')
}

/**
 * @returns {string[]}
 */
const getConfigMacIds = () =>
  process.env.VITE_RUUVITAG_MACS?.split(',').map((mac) => mac.trim()) || []

// ============================================================================
// Sensor Data Collection Mode Selection
// ============================================================================

// Detect if running under Jest (vs normal development with simulated data)
const isJestTest = process.env.NODE_ENV === 'test'

if (process.env.TEST || process.env.SIMULATE) {
  // Run in simulation/test mode
  logger.info('Running in SIMULATION MODE')
  logger.info('Using simulated sensor data')

  // Initialize history services (skip only during Jest tests)
  if (!isJestTest) {
    initializeHistoryServices()
  }

  // Start HTTP server after initialization
  startServer()

  /** @type {SensorDataCollection} */
  const sensorDataCollection = simulatorUtils.initSimulator()

  setInterval(() => {
    simulatorUtils.modifyDataWithWave(sensorDataCollection)
    updateSensorCache(sensorDataCollection)

    // Add readings to history buffer (skip during Jest tests)
    if (!isJestTest) {
      Object.entries(sensorDataCollection).forEach(([mac, sensorData]) => {
        addToHistoryBuffer(mac, sensorData)
      })
    }
  }, 1000)
} else {
  // Run with real RuuviTag sensors using Node.js BLE
  const macs = getConfigMacIds()
  logger.info({ macs }, 'Starting RuuviTag scanner')

  if (!macs || macs.length === 0) {
    logger.warn(
      'No MAC addresses configured. Set VITE_RUUVITAG_MACS environment variable.'
    )
  }

  // Initialize history services
  initializeHistoryServices()

  // Start HTTP server after initialization
  startServer()

  scannerInstance = ruuviScanner.createScanner({ macs })

  // Wire up scanner health data to diagnostics route
  setScannerHealthGetter(() => scannerInstance.getSensorHealth())

  // Register scanner stop for graceful shutdown
  shutdownHandler.registerScannerStop(() => {
    if (scannerInstance) {
      logger.info('Stopping RuuviTag BLE scanner')
      scannerInstance.stop()
    }
  })

  // Handle sensor data updates
  scannerInstance.on('collection', (sensorDataCollection) => {
    const mergedData = sensorService.getSensorData(
      sensorDataCollection,
      cache.get(cacheKeys.ruuvi),
      macs
    )
    updateSensorCache(mergedData)
  })

  // Handle individual sensor data (for logging and history)
  scannerInstance.on('data', ({ mac, sensorData }) => {
    logger.debug(
      {
        mac,
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
      },
      'Sensor reading'
    )

    // Add reading to history buffer
    addToHistoryBuffer(mac, sensorData)
  })

  // Handle errors
  scannerInstance.on('error', (error) => {
    logger.error({ err: error }, 'RuuviTag scanner error')
  })

  // Start scanning with a delay to allow BLE adapter to initialize
  logger.info('Waiting 3 seconds before starting RuuviTag scanner')
  setTimeout(() => {
    logger.info('Starting RuuviTag BLE scanner')
    scannerInstance.start()
  }, 3000)
}
