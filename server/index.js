const express = require('express')
const { exec } = require('child_process')
const NodeCache = require('node-cache')
const utils = require('./utils')
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
  try {
    const response = await fetch(
      'https://www.sahkohinta-api.fi/api/v1/halpa?tunnit=24&tulos=haja&aikaraja=2023-10-14'
    )
    console.log('api called')
    const json = await response.text()
    console.log(json)
    res.send(json)
  } catch (error) {
    console.error(error)
  }
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
