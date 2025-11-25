/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
const express = require('express')
const NodeCache = require('node-cache')
const path = require('path')
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

// Track active SSE connections for broadcasting updates
const sseConnections = new Set()

app.use(express.json())

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')))
}

app.listen(port, () => console.log(`Listening on port ${port}`))

app.get('/api/ruuvi', (req, res) => {
  res.send(cache.get(cacheKeys.ruuvi))
})

// ============================================================================
// SSE Streaming Endpoint for Real-time Sensor Data
// ============================================================================

/**
 * Server-Sent Events (SSE) endpoint for streaming real-time sensor data updates
 *
 * Benefits over HTTP polling:
 * - Lower latency for updates
 * - Reduced server load (single persistent connection vs repeated requests)
 * - More efficient on Raspberry Pi (fewer CPU cycles, less network overhead)
 *
 * Connection lifecycle:
 * 1. Client connects -> send initial data immediately
 * 2. Send updates every 10 seconds (configurable)
 * 3. Clean up resources when client disconnects
 */
app.get('/api/sensor-stream', (req, res) => {
  console.log(
    new Date().toLocaleString(),
    'SSE client connected. Active connections:',
    sseConnections.size + 1
  )

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Disable compression for SSE (improves latency)
  res.setHeader('X-Accel-Buffering', 'no')

  // Send initial sensor data immediately upon connection
  try {
    const initialData = cache.get(cacheKeys.ruuvi)
    if (initialData) {
      res.write(`data: ${JSON.stringify(initialData)}\n\n`)
      res.flush() // Ensure data is sent immediately
    } else {
      // Send empty collection if no data available yet
      res.write(`data: ${JSON.stringify({ sensors: [] })}\n\n`)
      res.flush()
    }
  } catch (error) {
    console.error('Error sending initial SSE data:', error)
    res.write(
      `data: ${JSON.stringify({ error: 'Failed to load initial data' })}\n\n`
    )
    res.flush()
  }

  // Store connection metadata
  const connection = {
    res,
    lastSent: Date.now(),
  }
  sseConnections.add(connection)

  // Set up periodic updates (every 10 seconds)
  // This ensures clients get updates even if BLE scanning is slow
  const updateInterval = setInterval(() => {
    try {
      const sensorData = cache.get(cacheKeys.ruuvi)
      if (sensorData) {
        res.write(`data: ${JSON.stringify(sensorData)}\n\n`)
        res.flush()
        connection.lastSent = Date.now()
      }
    } catch (error) {
      console.error('Error sending SSE update:', error)
      clearInterval(updateInterval)
      sseConnections.delete(connection)
      res.end()
    }
  }, 10000) // 10 seconds interval

  // Send heartbeat every 30 seconds to keep connection alive
  // This prevents proxies/firewalls from closing idle connections
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n')
      res.flush()
    } catch (error) {
      console.error('Error sending heartbeat:', error)
      clearInterval(heartbeatInterval)
    }
  }, 30000) // 30 seconds

  // Clean up resources when client disconnects
  req.on('close', () => {
    console.log(
      new Date().toLocaleString(),
      'SSE client disconnected. Active connections:',
      sseConnections.size - 1
    )
    clearInterval(updateInterval)
    clearInterval(heartbeatInterval)
    sseConnections.delete(connection)
    res.end()
  })

  // Handle errors
  res.on('error', (error) => {
    console.error('SSE connection error:', error)
    clearInterval(updateInterval)
    clearInterval(heartbeatInterval)
    sseConnections.delete(connection)
  })
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

// Catch-all route to serve React app for any non-API routes (must be after API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'))
  })
}

/**
 * Broadcast sensor data to all active SSE connections
 * @param {SensorDataCollection} sensorDataCollection
 */
const broadcastToSSEClients = (sensorDataCollection) => {
  if (sseConnections.size === 0) return

  const dataString = `data: ${JSON.stringify(sensorDataCollection)}\n\n`
  const disconnectedClients = []

  sseConnections.forEach((connection) => {
    try {
      connection.res.write(dataString)
      connection.res.flush()
      // eslint-disable-next-line no-param-reassign
      connection.lastSent = Date.now()
    } catch (error) {
      console.error('Error broadcasting to SSE client:', error)
      disconnectedClients.push(connection)
    }
  })

  // Clean up disconnected clients
  disconnectedClients.forEach((connection) => {
    sseConnections.delete(connection)
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

  // Broadcast updates to all connected SSE clients in real-time
  broadcastToSSEClients(sensorDataCollection)
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
