/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
const express = require('express')
const NodeCache = require('node-cache')
const temperatureService = require('./services/temperature')
const energyPricesService = require('./services/energyPrices')
const sensorService = require('./services/sensor')
const simulatorUtils = require('./utils/simulator')
const storage = require('./storage')
require('dotenv').config()

// Only import ruuviScanner when not in test mode (requires native BLE module)
let ruuviScanner = null
if (!process.env.TEST && !process.env.SIMULATE) {
  // eslint-disable-next-line global-require
  ruuviScanner = require('./services/ruuvi/ruuviScanner')
}

const app = express()
const port = process.env.PORT || 3001
const cache = new NodeCache()
const cacheKeys = {
  ruuvi: 'ruuvi',
  energyPrices: 'energyPrices',
  todayMinMax: 'todayMinMax',
}

app.use(express.json())
app.listen(port, () => console.log(`Listening on port ${port}`))

app.get('/api/ruuvi', (req, res) => {
  res.send(cache.get(cacheKeys.ruuvi))
})

// Keep POST endpoint for backward compatibility (e.g., external data sources)
app.post('/api/ruuvi', (req, res) => {
  console.log(new Date().toLocaleString(), 'POST /api/ruuvi received')
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
    console.error('POST /api/ruuvi, error: ', error)
    res
      .status(500)
      .json({ error: 'An error occurred while processing the data' })
  }
})

app.get('/api/energyprices', async (req, res) => {
  console.log(new Date().toLocaleString(), 'Energy prices called')
  /** @type {EnergyPrices=} */
  let cachedEnergyPrices = cache.get(cacheKeys.energyPrices)

  if (!cachedEnergyPrices) {
    console.log('Not in cache, try load store')
    const appStorage = await storage.loadOrDefaultSync()
    cachedEnergyPrices = {
      updatedAt: appStorage.todayEnergyPrices?.updatedAt,
      todayEnergyPrices: appStorage.todayEnergyPrices,
      tomorrowEnergyPrices: appStorage.tomorrowEnergyPrices,
    }
  }
  const energyPrices = await energyPricesService.getEnergyPrices(
    cachedEnergyPrices
  )
  cache.set(cacheKeys.energyPrices, energyPrices)

  const energyPricesForClient = {
    todayEnergyPrices: energyPrices.todayEnergyPrices?.data,
    tomorrowEnergyPrices: energyPrices.tomorrowEnergyPrices?.data,
  }
  res.send(energyPricesForClient)
})

app.get('/api/todayminmaxtemperature', async (req, res) => {
  res.send(cache.get(cacheKeys.todayMinMax))
})

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
 * @returns {string[]}
 */
const getConfigMacIds = () => process.env.REACT_APP_RUUVITAG_MACS?.split(',')

// ============================================================================
// Sensor Data Collection Mode Selection
// ============================================================================

if (process.env.TEST || process.env.SIMULATE) {
  // Run in simulation/test mode
  console.log('Run in SIMULATION MODE')
  console.log('Using simulated sensor data')

  /** @type {SensorDataCollection} */
  const sensorDataCollection = simulatorUtils.initSimulator()

  setInterval(() => {
    simulatorUtils.modifyDataWithWave(sensorDataCollection)
    updateSensorCache(sensorDataCollection)
  }, 1000)
} else {
  // Run with real RuuviTag sensors using Node.js BLE
  const macs = getConfigMacIds()
  console.log('Starting RuuviTag scanner with MAC addresses:', macs)

  if (!macs || macs.length === 0) {
    console.warn(
      'WARNING: No MAC addresses configured. Set REACT_APP_RUUVITAG_MACS environment variable.'
    )
  }

  const scanner = ruuviScanner.createScanner({ macs })

  // Handle sensor data updates
  scanner.on('collection', (sensorDataCollection) => {
    const mergedData = sensorService.getSensorData(
      sensorDataCollection,
      cache.get(cacheKeys.ruuvi),
      macs
    )
    updateSensorCache(mergedData)
  })

  // Handle individual sensor data (for logging)
  scanner.on('data', ({ mac, sensorData }) => {
    console.log(
      new Date().toLocaleString(),
      `Sensor ${mac}: ${sensorData.temperature.toFixed(
        1
      )}°C, ${sensorData.humidity.toFixed(1)}%`
    )
  })

  // Handle errors
  scanner.on('error', (error) => {
    console.error(new Date().toLocaleString(), 'RuuviTag scanner error:', error)
  })

  // Start scanning with a delay to allow BLE adapter to initialize
  console.log(
    new Date().toLocaleString(),
    'Wait 3sec before starting RuuviTag scanner'
  )
  setTimeout(() => {
    console.log(new Date().toLocaleString(), 'Starting RuuviTag BLE scanner')
    scanner.start()
  }, 3000)

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down RuuviTag scanner...')
    scanner.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\nShutting down RuuviTag scanner...')
    scanner.stop()
    process.exit(0)
  })
}
