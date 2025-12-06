import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import configs from '../configs'
import apiService from '../services/api'
import SensorHistoryRow from '../components/SensorHistoryRow'
import DetailChart from '../components/DetailChart'

/**
 * Available time range options for history data
 * @type {Array<{value: string, label: string}>}
 */
const TIME_RANGES = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'all', label: 'All' },
]

/**
 * History screen - displays historical sensor data with charts
 * @returns {JSX.Element}
 */
const HistoryScreen = () => {
  const [selectedRange, setSelectedRange] = useState('24h')
  const [selectedSensor, setSelectedSensor] = useState(null)
  const [historyData, setHistoryData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch history data for all sensors
   * @param {string} range - Time range to fetch
   */
  const fetchAllHistory = useCallback(async (range) => {
    setLoading(true)
    setError(null)

    try {
      const results = await Promise.all(
        configs.ruuviTags.map(async (sensor) => {
          const data = await apiService.fetchHistory(sensor.mac, range)
          return { mac: sensor.mac, data }
        })
      )

      const dataMap = {}
      results.forEach(({ mac, data }) => {
        dataMap[mac] = data
      })

      setHistoryData(dataMap)
    } catch (err) {
      setError('Failed to load history data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch data on mount and when range changes
  useEffect(() => {
    fetchAllHistory(selectedRange)
  }, [selectedRange, fetchAllHistory])

  /**
   * Handle time range selection change
   * @param {React.MouseEvent<HTMLElement>} _event - Click event
   * @param {string|null} newRange - Newly selected range
   */
  const handleRangeChange = (_event, newRange) => {
    if (newRange !== null) {
      setSelectedRange(newRange)
    }
  }

  /**
   * Handle sensor selection
   * @param {string} mac - MAC address of selected sensor
   */
  const handleSensorSelect = (mac) => {
    setSelectedSensor(mac === selectedSensor ? null : mac)
  }

  /**
   * Get current value from history data, formatted to 1 decimal
   * @param {Array} data - History data array
   * @returns {number|null} Latest temperature value
   */
  const getCurrentValue = (data) => {
    if (!data || data.length === 0) return null
    const temp = data[data.length - 1].temperature
    return Math.round(temp * 10) / 10
  }

  /**
   * Transform history data to sparkline format
   * @param {Array} data - History data array
   * @returns {Array} Data formatted for sparkline
   */
  const toSparklineData = (data) => {
    if (!data) return []
    return data.map((point) => ({
      timestamp: point.timestamp,
      value: point.temperature,
    }))
  }

  /**
   * Get the selected sensor object
   * @returns {Object|null} Selected sensor config
   */
  const getSelectedSensorConfig = () => {
    if (!selectedSensor) return null
    return configs.ruuviTags.find((s) => s.mac === selectedSensor)
  }

  const selectedSensorConfig = getSelectedSensorConfig()

  return (
    <Box px={2} pt={2} pb={0}>
      <Typography variant="h4" component="h1" gutterBottom>
        History
      </Typography>

      {/* Time Range Selector */}
      <Box mb={2}>
        <ToggleButtonGroup
          value={selectedRange}
          exclusive
          onChange={handleRangeChange}
          aria-label="time range selection"
          size="small"
        >
          {TIME_RANGES.map((range) => (
            <ToggleButton key={range.value} value={range.value}>
              {range.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box
          data-testid="loading-indicator"
          display="flex"
          justifyContent="center"
          py={4}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert data-testid="error-message" severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Sensor List */}
      {!loading && !error && (
        <Box>
          {configs.ruuviTags.map((sensor) => (
            <SensorHistoryRow
              key={sensor.mac}
              name={sensor.name}
              mac={sensor.mac}
              data={toSparklineData(historyData[sensor.mac])}
              currentValue={getCurrentValue(historyData[sensor.mac])}
              unit="°C"
              onSelect={handleSensorSelect}
              selected={selectedSensor === sensor.mac}
              timeRange={selectedRange}
            />
          ))}
        </Box>
      )}

      {/* Detail Chart */}
      {selectedSensorConfig && historyData[selectedSensor] && (
        <Box mt={2}>
          <DetailChart
            data={historyData[selectedSensor]}
            sensorName={selectedSensorConfig.name}
            timeRange={selectedRange}
          />
        </Box>
      )}
    </Box>
  )
}

export default HistoryScreen
