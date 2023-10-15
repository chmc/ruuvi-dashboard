// Wave height and frequency
const amplitude = 0.5
const frequency = 0.1

const initSimulator = () => ({
  mac1: {
    data_format: 5,
    humidity: 42.0,
    temperature: 22.37,
    pressure: 1013.07,
  },
  mac2: {
    data_format: 5,
    humidity: 73.17,
    temperature: 7.37,
    pressure: 1015.3,
  },
  mac3: {
    data_format: 5,
    humidity: 42.9,
    temperature: 24.42,
    pressure: 1013.58,
  },
})

const modifyDataWithWave = (jsonData) => {
  const currentTime = new Date().getTime()
  const macs = Object.keys(jsonData)
  macs.forEach((mac) => {
    const data = jsonData[mac]
    data.humidity += amplitude * Math.sin(frequency * currentTime)
    data.temperature += amplitude * Math.sin(frequency * currentTime)
    data.pressure += amplitude * Math.sin(frequency * currentTime)
  })

  return jsonData
}

module.exports = {
  initSimulator,
  modifyDataWithWave,
}
