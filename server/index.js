/* eslint-disable no-console */
const express = require('express')
const { spawn } = require('child_process')
const NodeCache = require('node-cache')
const utils = require('./utils')
const simulatorUtils = require('./utils/simulator')
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

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`))

// create a GET route
app.get('/api/express_backend', (req, res) => {
  console.log('api call received')
  res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' }) // Line 10
})

app.get('/api/ruuvi', (req, res) => {
  console.log(new Date().toLocaleString(), 'api get ruuvi received')
  res.send(cache.get(cacheKeys.ruuvi))
})

app.post('/api/ruuvi', (req, res) => {
  console.log(new Date().toLocaleString(), 'post call received')
  /** @type {SensorDataCollection} */
  try {
    const sensorDataCollection = req.body
    cache.set(cacheKeys.ruuvi, sensorDataCollection)

    const todayminmaxtemperature = utils.getTodayMinMaxTemperature(
      sensorDataCollection,
      cache.get(cacheKeys.todayMinMax)
    )
    if (todayminmaxtemperature) {
      cache.set(cacheKeys.todayMinMax, todayminmaxtemperature)
    }
  } catch (error) {
    console.error('POST /api/ruuvi, error: ', error)
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
  const energyPrices = await utils.getEnergyPrices(cachedEnergyPrices)
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
  // const command = `python3 ${ruuviScript} --macs "${macs}"`
  // console.log('command: ', command)
  const args = [ruuviScript, '--macs', macs]

  // // eslint-disable-next-line no-inner-declarations
  // function execRuuviScript() {
  //   exec(command, (error, stdout, stderr) => {
  //     if (error) {
  //       console.error(`Error: ${error.message}`)
  //       return
  //     }
  //     console.log(`Python script output:\n${stdout}`)
  //   })
  // }

  // eslint-disable-next-line no-inner-declarations
  function runRuuviScript() {
    const pythonProcess = spawn('python3', args)

    // When the Python script starts, set a timeout
    const timeoutId = setTimeout(() => {
      console.log(
        'Python Ruuvi script execution timed out. Terminating process.'
      )
      pythonProcess.kill('SIGKILL')
    }, 35000)

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python Ruuvi script output: ${data}`)
    })

    pythonProcess.stderr.on('data', (data) => {
      console.log(`Python Ruuvi script ERROR: ${data}`)
    })

    pythonProcess.on('close', (code) => {
      clearTimeout(timeoutId)
      console.log(`Python Ruuvi script exited with code ${code}`)
    })

    pythonProcess.on('error', (err) => {
      console.error('Error starting Python Ruuvi script:', err)
    })

    pythonProcess.stdin.end()
    pythonProcess.stdout.end()
    pythonProcess.stderr.end()
  }

  console.log('Wait 3sec before first ruuvi script run')
  setTimeout(() => {
    console.log('Call ruuvi script')
    runRuuviScript()
  }, 3000)

  // Run every 60sec
  console.log('Run ruuvi script every 60sec')
  const interval = setInterval(runRuuviScript, 60000)
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
      utils.getTodayMinMaxTemperature(
        sensorDataCollection,
        cache.get(cacheKeys.todayMinMax)
      )
    )

    // console.log(jsonData);
  }, 1000)
}
