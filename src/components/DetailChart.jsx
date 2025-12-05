import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

/**
 * @typedef {Object} HistoryDataPoint
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {number} temperature - Temperature in Celsius
 * @property {number} humidity - Humidity percentage
 * @property {number} pressure - Pressure in hPa
 */

/**
 * Metric configuration for tabs
 * @type {Array<{key: string, label: string, unit: string, color: string}>}
 */
const METRICS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#ff7043' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#42a5f5' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#66bb6a' },
]

/**
 * Default chart height in pixels
 */
const DEFAULT_HEIGHT = 250

/**
 * Format timestamp for X axis based on time range
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {string} [timeRange] - Time range (1h, 6h, 24h, 7d, 30d, all)
 * @returns {string} Formatted time string
 */
const formatXAxisTime = (timestamp, timeRange) => {
  const date = new Date(timestamp)

  // For shorter ranges, show time only
  if (timeRange === '1h' || timeRange === '6h') {
    return date.toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // For 24h, show time
  if (timeRange === '24h') {
    return date.toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // For longer ranges, show date
  if (timeRange === '7d') {
    return date.toLocaleDateString('fi-FI', {
      weekday: 'short',
      day: 'numeric',
    })
  }

  // For 30d and all, show date
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
}

/**
 * Format timestamp for tooltip label
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date/time string
 */
const formatTooltipLabel = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('fi-FI', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format value for tooltip display
 * @param {number} value - The metric value
 * @param {string} unit - The unit string
 * @returns {string} Formatted value with unit
 */
const formatTooltipValue = (value, unit) => {
  if (value === null || value === undefined) return '-'
  const formatted = typeof value === 'number' ? value.toFixed(1) : value
  return `${formatted}${unit}`
}

/**
 * Format value for Y axis display
 * @param {number} value - The metric value
 * @returns {string} Formatted value
 */
const formatYAxisValue = (value) => {
  if (value === null || value === undefined) return ''
  return typeof value === 'number' ? value.toFixed(0) : value
}

/**
 * DetailChart - full-size chart for displaying sensor history
 *
 * @param {Object} props
 * @param {HistoryDataPoint[]} [props.data] - Array of history data points
 * @param {string} props.sensorName - Name of the sensor
 * @param {string} [props.timeRange] - Current time range (1h, 6h, 24h, 7d, 30d, all)
 * @param {number} [props.height] - Chart height in pixels (default: 250)
 * @returns {JSX.Element}
 */
const DetailChart = ({
  data,
  sensorName,
  timeRange = '24h',
  height = DEFAULT_HEIGHT,
}) => {
  const [selectedMetric, setSelectedMetric] = useState(0)

  // Normalize data to empty array if null/undefined
  const normalizedData = data || []

  // Get current metric configuration
  const currentMetric = METRICS[selectedMetric]

  /**
   * Handle metric tab change
   * @param {React.SyntheticEvent} _event - Change event
   * @param {number} newValue - New tab index
   */
  const handleMetricChange = (_event, newValue) => {
    setSelectedMetric(newValue)
  }

  /**
   * Custom tooltip formatter
   * @param {number} value - The value
   * @returns {[string, string]} Formatted value and name
   */
  const tooltipFormatter = (value) => [
    formatTooltipValue(value, currentMetric.unit),
    currentMetric.label,
  ]

  return (
    <Box>
      {/* Sensor Name Title */}
      <Typography variant="h6" component="h2" gutterBottom>
        {sensorName}
      </Typography>

      {/* Metric Tabs */}
      <Tabs
        value={selectedMetric}
        onChange={handleMetricChange}
        aria-label="metric selection"
        sx={{ mb: 1 }}
      >
        {METRICS.map((metric) => (
          <Tab key={metric.key} label={metric.label} />
        ))}
      </Tabs>

      {/* Chart */}
      <Box
        data-testid="detail-chart-wrapper"
        sx={{ height: `${height}px`, width: '100%' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={normalizedData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) => formatXAxisTime(ts, timeRange)}
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={formatYAxisValue}
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
              width={45}
            />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: 'rgba(30, 30, 30, 0.95)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
              }}
            />
            <Line
              type="monotone"
              dataKey={currentMetric.key}
              stroke={currentMetric.color}
              strokeWidth={2}
              dot={false}
              name={currentMetric.label}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

export default DetailChart
