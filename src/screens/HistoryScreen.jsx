import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import configs from '../configs'
import apiService from '../services/api'
import SensorHistoryRow from '../components/SensorHistoryRow'
import DetailChart from '../components/DetailChart'
import LoadingOverlay from '../components/LoadingOverlay'
import ErrorAlert from '../components/ErrorAlert'
import { METRICS } from '../constants/metrics'
import { TIME_RANGES, DEFAULT_TIME_RANGE } from '../constants/timeRanges'

/**
 * History screen - displays historical sensor data with charts
 * @returns {JSX.Element}
 */
const HistoryScreen = () => {
  const [selectedRange, setSelectedRange] = useState(DEFAULT_TIME_RANGE)
  const [selectedSensor, setSelectedSensor] = useState(null)
  const [selectedMetrics, setSelectedMetrics] = useState(['temperature'])
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
   * Handle sensor selection (single select, click to toggle)
   * @param {string} mac - MAC address of sensor to select
   */
  const handleSensorSelect = (mac) => {
    setSelectedSensor(mac === selectedSensor ? null : mac)
  }

  /**
   * Handle metric checkbox toggle
   * @param {string} metricKey - The metric key to toggle
   */
  const handleMetricToggle = (metricKey) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(metricKey)) {
        // Don't allow deselecting the last metric
        if (prev.length > 1) {
          return prev.filter((m) => m !== metricKey)
        }
        return prev
      }
      return [...prev, metricKey]
    })
  }

  /**
   * Get the selected sensor config
   * @returns {Object|null} Selected sensor config
   */
  const getSelectedSensorConfig = () => {
    if (!selectedSensor) return null
    return configs.ruuviTags.find((s) => s.mac === selectedSensor)
  }

  const selectedSensorConfig = getSelectedSensorConfig()

  // Calculate dynamic row height based on number of sensors
  const sensorCount = configs.ruuviTags.length

  return (
    <Box
      data-testid="history-screen-container"
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        px: 2,
        pt: 2,
        pb: 0,
        boxSizing: 'border-box',
      }}
    >
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

      {/* Metric Selection Checkboxes */}
      <Box mb={2}>
        <FormGroup row aria-label="metric selection">
          {METRICS.map((metric) => (
            <FormControlLabel
              key={metric.key}
              control={
                <Checkbox
                  checked={selectedMetrics.includes(metric.key)}
                  onChange={() => handleMetricToggle(metric.key)}
                  size="small"
                  sx={{
                    color: metric.color,
                    '&.Mui-checked': { color: metric.color },
                  }}
                />
              }
              label={metric.label}
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.875rem',
                  color: selectedMetrics.includes(metric.key)
                    ? metric.color
                    : 'text.secondary',
                },
              }}
            />
          ))}
        </FormGroup>
      </Box>

      {/* Loading State */}
      <LoadingOverlay loading={loading} />

      {/* Error State */}
      <ErrorAlert error={error} />

      {/* Sensor List - grows to fill available space */}
      {!loading && !error && (
        <Box
          data-testid="sensor-rows-container"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {/* Header row with column labels */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px={1.5}
            pb={0.5}
            sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Typography
              variant="caption"
              sx={{ minWidth: 100, color: 'text.secondary' }}
            >
              Sensor
            </Typography>
            <Box sx={{ flex: 1, mx: 2 }} />
            <Typography
              variant="caption"
              sx={{ minWidth: 80, textAlign: 'right', color: 'text.secondary' }}
            >
              Current
            </Typography>
          </Box>
          {/* Sensor rows container - fills remaining space */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            {configs.ruuviTags.map((sensor) => (
              <SensorHistoryRow
                key={sensor.mac}
                name={sensor.name}
                mac={sensor.mac}
                historyData={historyData[sensor.mac]}
                selectedMetrics={selectedMetrics}
                onSelect={handleSensorSelect}
                selected={selectedSensor === sensor.mac}
                timeRange={selectedRange}
                sensorCount={sensorCount}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Detail Chart */}
      {selectedSensorConfig && historyData[selectedSensor] && (
        <Box mt={2}>
          <DetailChart
            data={historyData[selectedSensor]}
            sensorName={selectedSensorConfig.name}
            selectedMetrics={selectedMetrics}
            timeRange={selectedRange}
          />
        </Box>
      )}
    </Box>
  )
}

export default HistoryScreen
