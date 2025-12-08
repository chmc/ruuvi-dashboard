const fetchRuuviData = async () => {
  const response = await fetch('/api/ruuvi')
  return response.json()
}

/**
 * Fetch weather data from backend proxy
 * @returns {Promise<WeatherForecast>}
 */
const fetchWeatherData = async () => {
  const response = await fetch('/api/weather')

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}`)
  }

  return response.json()
}

const fetchEnergyPrices = async () => {
  const response = await fetch('/api/energyprices')
  const text = await response.text()
  const json = JSON.parse(text)
  return json
}

const fetchMinMaxTemperatures = async () => {
  const response = await fetch('/api/todayminmaxtemperature')
  return response.json()
}

/**
 * Fetch trend data for specified sensors
 * @param {string[]} macs - Array of MAC addresses
 * @returns {Promise<Array<{mac: string, temperature: {direction: string, delta: number} | null, humidity: {direction: string, delta: number} | null}>>}
 */
const fetchTrends = async (macs) => {
  const macsParam = macs.join(',')
  const response = await fetch(`/api/ruuvi/trends?macs=${macsParam}`)
  return response.json()
}

/**
 * @typedef {Object} HistoryDataPoint
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {number} temperature - Temperature in Celsius
 * @property {number} humidity - Humidity percentage
 * @property {number} pressure - Pressure in hPa
 */

/**
 * Fetch historical sensor data
 * @param {string} mac - MAC address of the sensor
 * @param {string} [range='24h'] - Time range (1h, 6h, 24h, 7d, 30d, all)
 * @returns {Promise<HistoryDataPoint[]>} Array of history data points
 */
const fetchHistory = async (mac, range = '24h') => {
  const response = await fetch(`/api/ruuvi/history?mac=${mac}&range=${range}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.status}`)
  }
  return response.json()
}

/**
 * @typedef {Object} DiagnosticsData
 * @property {number} bufferSize - Number of readings in buffer
 * @property {number | null} lastFlushTime - Timestamp of last flush
 * @property {Array<{mac: string, voltage: number | null, lastSeen: number | null}>} batteries - Battery levels for sensors
 * @property {Array<{mac: string, lastSeen: number | null, rssi: number | null, status: 'online' | 'stale' | 'offline'}>} sensorHealth - Sensor health data
 * @property {number} dbSize - Database size in bytes
 * @property {number | null} oldestRecord - Timestamp of oldest record
 * @property {number} uptime - Server uptime in milliseconds
 */

/**
 * Fetch diagnostics data from the server
 * @param {string[]} [macs=[]] - Array of MAC addresses to get battery levels for
 * @returns {Promise<DiagnosticsData>}
 */
const getDiagnostics = async (macs = []) => {
  const macsParam = macs.length > 0 ? macs.join(',') : ''
  const url = macsParam
    ? `/api/diagnostics?macs=${macsParam}`
    : '/api/diagnostics'
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch diagnostics: ${response.status}`)
  }
  return response.json()
}

/**
 * Flush the buffer to database
 * @returns {Promise<{success: boolean, flushedCount: number, message: string}>}
 */
const flushBuffer = async () => {
  const response = await fetch('/api/diagnostics/flush', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `Failed to flush buffer: ${response.status}`)
  }
  return response.json()
}

/**
 * Report external API status to backend
 * @param {'openWeatherMap'} api - API name
 * @param {'success' | 'error'} status - Status to report
 * @param {string} [errorMessage] - Error message (required if status is 'error')
 * @returns {Promise<{success: boolean}>}
 */
const reportApiStatus = async (api, status, errorMessage) => {
  const response = await fetch('/api/diagnostics/api-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ api, status, errorMessage }),
  })
  if (!response.ok) {
    // Silently fail - don't break the app if status reporting fails
    return { success: false }
  }
  return response.json()
}

const apiService = {
  fetchRuuviData,
  fetchWeatherData,
  fetchEnergyPrices,
  fetchMinMaxTemperatures,
  fetchTrends,
  fetchHistory,
  getDiagnostics,
  flushBuffer,
  reportApiStatus,
}

export default apiService
