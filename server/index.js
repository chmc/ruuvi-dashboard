/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
const express = require('express')
const { spawn } = require('child_process')
const NodeCache = require('node-cache')
const temperatureService = require('./services/temperature')
const energyPricesService = require('./services/energyPrices')
const sensorService = require('./services/sensor')
const simulatorUtils = require('./utils/simulator')
const bluetoothUtils = require('./utils/bluetooth')
const storage = require('./storage')
require('dotenv').config()

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
  // console.log(new Date().toLocaleString(), 'api get ruuvi received')
  res.send(cache.get(cacheKeys.ruuvi))
})

app.post('/api/ruuvi', (req, res) => {
  console.log(new Date().toLocaleString(), 'post call received')
  try {
    const sensorDataCollection = sensorService.getSensorData(
      req.body,
      getConfigMacIds()
    )
    cache.set(cacheKeys.ruuvi, sensorDataCollection)

    const todayminmaxtemperature = temperatureService.getTodayMinMaxTemperature(
      sensorDataCollection,
      cache.get(cacheKeys.todayMinMax)
    )
    if (todayminmaxtemperature) {
      cache.set(cacheKeys.todayMinMax, todayminmaxtemperature)
    }
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

if (!process.env.TEST) {
  // Get real Ruuvi Tags data
  const macs = process.env.REACT_APP_RUUVITAG_MACS
  console.log('macs: ', macs)
  const ruuviScript = './scripts/ruuvi.py'
  const args = [ruuviScript, '--macs', macs]

  // eslint-disable-next-line no-inner-declarations
  function runRuuviScript() {
    const pythonProcess = spawn('python3', args)
    const timeoutInSec = 95000

    const timeoutId = setTimeout(() => {
      console.log(
        new Date().toLocaleString(),
        'Python Ruuvi script execution timed out. Terminating process.'
      )
      pythonProcess.kill('SIGKILL')
    }, timeoutInSec)

    pythonProcess.stdout.on('data', (data) => {
      console.log(
        new Date().toLocaleString(),
        `Python Ruuvi script output: ${data}`
      )
    })

    pythonProcess.stderr.on('data', (data) => {
      console.log(
        new Date().toLocaleString(),
        `Python Ruuvi script ERROR: ${data}`
      )
      console.log(new Date().toLocaleString(), 'Next reset bluetooth interface')
      bluetoothUtils.resetBluetoothInterface()
    })

    pythonProcess.on('close', (code) => {
      clearTimeout(timeoutId)
      console.log(
        new Date().toLocaleString(),
        `Python Ruuvi script exited with code ${code}. Next run in 10sec.`
      )
      // Schedule the next run after completion
      setTimeout(runRuuviScript, 10000)
    })

    pythonProcess.on('error', (err) => {
      console.error(
        new Date().toLocaleString(),
        'Error starting Python Ruuvi script:',
        err
      )
    })

    pythonProcess.stdin.end()
    pythonProcess.stdout.end()
    pythonProcess.stderr.end()
  }

  console.log(
    new Date().toLocaleString(),
    'Wait 3sec before the first Ruuvi script run'
  )
  setTimeout(() => {
    console.log(new Date().toLocaleString(), 'Call Ruuvi script')
    runRuuviScript()
  }, 3000)
} else {
  // Run in test mode
  console.log('Run in TEST MODE')
  console.log('Do not run python script')
  /** @type {SensorDataCollection} */
  const sensorDataCollection = simulatorUtils.initSimulator()

  setInterval(() => {
    simulatorUtils.modifyDataWithWave(sensorDataCollection)
    cache.set(cacheKeys.ruuvi, sensorDataCollection)
    cache.set(
      cacheKeys.todayMinMax,
      temperatureService.getTodayMinMaxTemperature(
        sensorDataCollection,
        cache.get(cacheKeys.todayMinMax)
      )
    )

    // console.log(jsonData);
  }, 1000)
}

/**
 * @returns {string[]}
 */
const getConfigMacIds = () => process.env.REACT_APP_RUUVITAG_MACS?.split(',')
