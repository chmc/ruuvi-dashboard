/* eslint-disable no-console */
const express = require('express')
const { exec } = require('child_process')
const NodeCache = require('node-cache')
const utils = require('./utils')
const storage = require('./storage')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3001
const cache = new NodeCache({ stdTTL: 60 })
const cacheKeys = {
  ruuvi: 'ruuvi',
  energyPrices: 'energyPrices',
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
  console.log('api get ruuvi received')
  res.send(cache.get(cacheKeys.ruuvi))
})

app.post('/api/ruuvi', (req, res) => {
  console.log('post call received')
  const data = req.body
  cache.set(cacheKeys.ruuvi, data)
  console.log(data)
})

app.get('/api/energyprices', async (req, res) => {
  console.log('Energy prices called')
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

if (!process.env.TEST) {
  // Get real Ruuvi Tags data
  const macs = process.env.REACT_APP_RUUVITAG_MACS
  console.log('macs: ', macs)
  const ruuviScript = './scripts/ruuvi.py'
  const command = `python3 ${ruuviScript} --macs "${macs}"`
  console.log('command: ', command)

  // eslint-disable-next-line no-inner-declarations
  function execRuuviScript() {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`)
        return
      }
      console.log(`Python script output:\n${stdout}`)
    })
  }

  console.log('Wait 3sec before first ruuvi script run')
  setTimeout(() => {
    console.log('Call ruuvi script')
    execRuuviScript()
  }, 3000)

  // Run every 10sec
  console.log('Run ruuvi script every 35sec')
  const interval = setInterval(execRuuviScript, 35000)
} else {
  // Run in test mode
  console.log('Run in TEST MODE')
  console.log('Do not run python script')
  const jsonData = utils.initSimulator()

  setInterval(() => {
    utils.modifyDataWithWave(jsonData)
    cache.set(cacheKeys.ruuvi, jsonData)
    // console.log(jsonData);
  }, 1000)
}
