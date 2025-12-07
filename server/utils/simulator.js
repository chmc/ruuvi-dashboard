// Wave height and frequency
const amplitude = 0.5
const frequency = 0.1

// Default sensor data templates (indoor, outdoor, bedroom, bathroom)
// batteryVoltage in millivolts (typical range 2400-3100mV)
const sensorDefaults = [
  { humidity: 42.0, temperature: 22.37, pressure: 1013.07, batteryVoltage: 2950 },
  { humidity: 73.17, temperature: 7.37, pressure: 1015.3, batteryVoltage: 2875 },
  { humidity: 42.9, temperature: 24.42, pressure: 1013.58, batteryVoltage: 3010 },
  { humidity: 79.2, temperature: 27.29, pressure: 997.28, batteryVoltage: 2800 },
]

const initSimulator = () => {
  const macs = process.env.VITE_RUUVITAG_MACS?.split(',') || [
    'mac1',
    'mac2',
    'mac3',
    'mac4',
  ]

  const result = {}
  macs.forEach((mac, index) => {
    const normalizedMac = mac.toLowerCase()
    const defaults = sensorDefaults[index] || sensorDefaults[0]
    result[normalizedMac] = {
      data_format: 5,
      humidity: defaults.humidity,
      temperature: defaults.temperature,
      pressure: defaults.pressure,
      batteryVoltage: defaults.batteryVoltage,
    }
  })

  return result
}

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
