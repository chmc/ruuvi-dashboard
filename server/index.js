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
  res.send(cache.get('ruuvi'))
})

app.post('/api/ruuvi', (req, res) => {
  console.log('post call received')
  const data = req.body
  cache.set('ruuvi', data)
  console.log(data)
})

app.get('/api/energyprices', async (req, res) => {
  console.log('energy prices called')
  const appStorage = await storage.loadOrDefaultSync()
  // console.log('storage', appStorage)
  const json = await utils.getEnergyPrices(appStorage)
  res.send(json)
  // console.log('send done')
  // try {
  //   const appStorage = storage.loadOrDefault()
  //   const currentDate = new Date().toISOString().split('T')[0]
  //   // const response = await fetch(
  //   //   `https://www.sahkohinta-api.fi/api/v1/halpa?tunnit=24&tulos=haja&aikaraja=${currentDate}`
  //   // )
  //   // console.log('api called')
  //   // const json = await response.text()
  //   const json =
  //     '[{"aikaleima_suomi":"2023-10-14T06:00","aikaleima_utc":"2023-10-14T03:00","hinta":"-0.43700"},{"aikaleima_suomi":"2023-10-14T05:00","aikaleima_utc":"2023-10-14T02:00","hinta":"-0.39500"},{"aikaleima_suomi":"2023-10-14T04:00","aikaleima_utc":"2023-10-14T01:00","hinta":"-0.34300"},{"aikaleima_suomi":"2023-10-14T07:00","aikaleima_utc":"2023-10-14T04:00","hinta":"-0.30200"},{"aikaleima_suomi":"2023-10-14T00:00","aikaleima_utc":"2023-10-13T21:00","hinta":"-0.29800"},{"aikaleima_suomi":"2023-10-14T03:00","aikaleima_utc":"2023-10-14T00:00","hinta":"-0.27700"},{"aikaleima_suomi":"2023-10-14T14:00","aikaleima_utc":"2023-10-14T11:00","hinta":"-0.26200"},{"aikaleima_suomi":"2023-10-14T13:00","aikaleima_utc":"2023-10-14T10:00","hinta":"-0.26000"},{"aikaleima_suomi":"2023-10-14T08:00","aikaleima_utc":"2023-10-14T05:00","hinta":"-0.26000"},{"aikaleima_suomi":"2023-10-14T23:00","aikaleima_utc":"2023-10-14T20:00","hinta":"-0.22400"},{"aikaleima_suomi":"2023-10-14T12:00","aikaleima_utc":"2023-10-14T09:00","hinta":"-0.21900"},{"aikaleima_suomi":"2023-10-14T11:00","aikaleima_utc":"2023-10-14T08:00","hinta":"-0.21900"},{"aikaleima_suomi":"2023-10-14T15:00","aikaleima_utc":"2023-10-14T12:00","hinta":"-0.21100"},{"aikaleima_suomi":"2023-10-14T02:00","aikaleima_utc":"2023-10-13T23:00","hinta":"-0.20600"},{"aikaleima_suomi":"2023-10-14T10:00","aikaleima_utc":"2023-10-14T07:00","hinta":"-0.20300"},{"aikaleima_suomi":"2023-10-14T09:00","aikaleima_utc":"2023-10-14T06:00","hinta":"-0.20300"},{"aikaleima_suomi":"2023-10-14T22:00","aikaleima_utc":"2023-10-14T19:00","hinta":"-0.12700"},{"aikaleima_suomi":"2023-10-14T01:00","aikaleima_utc":"2023-10-13T22:00","hinta":"-0.12500"},{"aikaleima_suomi":"2023-10-14T16:00","aikaleima_utc":"2023-10-14T13:00","hinta":"-0.12500"},{"aikaleima_suomi":"2023-10-14T21:00","aikaleima_utc":"2023-10-14T18:00","hinta":"-0.10700"},{"aikaleima_suomi":"2023-10-14T17:00","aikaleima_utc":"2023-10-14T14:00","hinta":"-0.10200"},{"aikaleima_suomi":"2023-10-14T18:00","aikaleima_utc":"2023-10-14T15:00","hinta":"0.00000"},{"aikaleima_suomi":"2023-10-14T20:00","aikaleima_utc":"2023-10-14T17:00","hinta":"0.00000"},{"aikaleima_suomi":"2023-10-14T19:00","aikaleima_utc":"2023-10-14T16:00","hinta":"0.00100"}]'

  //   console.log(json)
  //   res.send(json)
  //   console.log('send done')

  //   console.log('storage loaded')
  //   appStorage.todayEnergyPrices = {
  //     updatedAt: new Date(),
  //     pricesForDate: currentDate,
  //     data: json,
  //   }
  //   await storage.save(appStorage)
  // } catch (error) {
  //   console.error(error)
  // }
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
    cache.set('ruuvi', jsonData)
    // console.log(jsonData);
  }, 1000)
}
