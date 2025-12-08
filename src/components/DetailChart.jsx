import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { METRICS } from '../constants/metrics'

/**
 * @typedef {Object} HistoryDataPoint
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {number} temperature - Temperature in Celsius
 * @property {number} humidity - Humidity percentage
 * @property {number} pressure - Pressure in hPa
 */

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
 * @typedef {Object} SensorConfig
 * @property {string} mac - Sensor MAC address (used as key)
 * @property {string} name - Sensor display name
 * @property {string} color - Line color for this sensor
 */

/**
 * Merge multi-sensor data by timestamp for aligned chart display
 * @param {Object<string, HistoryDataPoint[]>} multiSensorData - Data keyed by sensor MAC
 * @param {SensorConfig[]} sensorConfigs - Sensor configurations
 * @param {string[]} metricKeys - Array of metric keys to include
 * @returns {Array} Merged data array with timestamp and sensor-specific values
 */
const mergeMultiSensorData = (multiSensorData, sensorConfigs, metricKeys) => {
  // Collect all timestamps from all sensors
  const timestampMap = new Map()

  sensorConfigs.forEach((config) => {
    const sensorData = multiSensorData[config.mac] || []
    sensorData.forEach((point) => {
      if (!timestampMap.has(point.timestamp)) {
        timestampMap.set(point.timestamp, { timestamp: point.timestamp })
      }
      const entry = timestampMap.get(point.timestamp)
      metricKeys.forEach((metricKey) => {
        entry[`${metricKey}-${config.mac}`] = point[metricKey]
      })
    })
  })

  // Sort by timestamp and return as array
  return Array.from(timestampMap.values()).sort(
    (a, b) => a.timestamp - b.timestamp
  )
}

/**
 * DetailChart - full-size chart for displaying sensor history
 *
 * Supports two modes:
 * 1. Single sensor mode: Use `data` and `sensorName` props
 * 2. Multi-sensor mode: Use `multiSensorData` and `sensorConfigs` props
 *
 * In both modes, multiple metrics can be displayed simultaneously using checkboxes.
 *
 * @param {Object} props
 * @param {HistoryDataPoint[]} [props.data] - Array of history data points (single sensor mode)
 * @param {string} [props.sensorName] - Name of the sensor (single sensor mode)
 * @param {Object<string, HistoryDataPoint[]>} [props.multiSensorData] - Data keyed by MAC (multi-sensor mode)
 * @param {SensorConfig[]} [props.sensorConfigs] - Sensor configurations (multi-sensor mode)
 * @param {string[]} [props.selectedMetrics] - Array of metric keys to display (default: ['temperature'])
 * @param {string} [props.timeRange] - Current time range (1h, 6h, 24h, 7d, 30d, all)
 * @param {number} [props.height] - Chart height in pixels (default: 250)
 * @returns {JSX.Element}
 */
const DetailChart = ({
  data,
  sensorName,
  multiSensorData,
  sensorConfigs,
  selectedMetrics = ['temperature'],
  timeRange = '24h',
  height = DEFAULT_HEIGHT,
}) => {
  // Determine if we're in multi-sensor mode
  const isMultiSensorMode = multiSensorData && sensorConfigs?.length > 0

  // Get selected metrics as array of metric configs for iteration
  const selectedMetricsArray = METRICS.filter((m) =>
    selectedMetrics.includes(m.key)
  )

  // Prepare chart data based on mode
  const chartData = isMultiSensorMode
    ? mergeMultiSensorData(
        multiSensorData,
        sensorConfigs,
        selectedMetricsArray.map((m) => m.key)
      )
    : data || []

  /**
   * Custom tooltip formatter
   * @param {number} value - The value
   * @param {string} name - The data key or name
   * @returns {[string, string]} Formatted value and label
   */
  const tooltipFormatter = (value, name) => {
    // Find the metric for this data key
    let metricKey = name
    let sensorLabel = ''

    if (isMultiSensorMode) {
      // Extract metric and sensor from dataKey (e.g., "temperature-sensor1")
      const metric = METRICS.find((m) => name.startsWith(m.key))
      if (metric) {
        metricKey = metric.key
        const mac = name.replace(`${metric.key}-`, '')
        const config = sensorConfigs.find((c) => c.mac === mac)
        sensorLabel = config?.name || mac
      }
    }

    const metric = METRICS.find((m) => m.key === metricKey)
    const unit = metric?.unit || ''
    const label = isMultiSensorMode
      ? `${metric?.label || metricKey} (${sensorLabel})`
      : metric?.label || metricKey

    return [formatTooltipValue(value, unit), label]
  }

  // Determine Y-axis positioning for selected metrics
  // First metric uses left axis, subsequent use right
  const getYAxisOrientation = (index) => (index === 0 ? 'left' : 'right')

  // Build legend payload
  const buildLegendPayload = () => {
    if (isMultiSensorMode) {
      // For multi-sensor, show sensor names with their colors
      const payload = []
      sensorConfigs.forEach((config) => {
        selectedMetricsArray.forEach((metric) => {
          payload.push({
            value: `${config.name} - ${metric.label}`,
            type: 'line',
            color: config.color,
          })
        })
      })
      return payload
    }
    // For single sensor, show metric names
    return selectedMetricsArray.map((metric) => ({
      value: metric.label,
      type: 'line',
      color: metric.color,
    }))
  }

  const legendPayload = buildLegendPayload()

  return (
    <Box>
      {/* Title */}
      <Typography variant="h6" component="h2" gutterBottom>
        {isMultiSensorMode ? 'Sensor Comparison' : sensorName}
      </Typography>

      {/* Chart */}
      <Box
        data-testid="detail-chart-wrapper"
        sx={{ height: `${height}px`, width: '100%' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: selectedMetricsArray.length > 1 ? 60 : 20,
              left: 0,
              bottom: 5,
            }}
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

            {/* Render Y-axis for each selected metric */}
            {selectedMetricsArray.map((metric, index) => (
              <YAxis
                key={metric.key}
                yAxisId={metric.key}
                orientation={getYAxisOrientation(index)}
                domain={['auto', 'auto']}
                tickFormatter={formatYAxisValue}
                stroke={metric.color}
                tick={{ fill: metric.color, fontSize: 12 }}
                width={45}
                label={
                  selectedMetricsArray.length > 1
                    ? {
                        value: metric.unit,
                        angle: index === 0 ? -90 : 90,
                        position: index === 0 ? 'insideLeft' : 'insideRight',
                        fill: metric.color,
                        fontSize: 11,
                      }
                    : undefined
                }
              />
            ))}

            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: 'rgba(30, 30, 30, 0.95)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
              }}
            />

            {(isMultiSensorMode || selectedMetricsArray.length > 1) && (
              <Legend payload={legendPayload} />
            )}

            {/* Render lines based on mode */}
            {isMultiSensorMode
              ? // Multi-sensor mode: render line for each sensor × each metric
                sensorConfigs.flatMap((config) =>
                  selectedMetricsArray.map((metric) => (
                    <Line
                      key={`${metric.key}-${config.mac}`}
                      type="monotone"
                      dataKey={`${metric.key}-${config.mac}`}
                      stroke={config.color}
                      strokeWidth={2}
                      strokeDasharray={
                        metric.key === 'humidity'
                          ? '5 5'
                          : metric.key === 'pressure'
                            ? '2 2'
                            : undefined
                      }
                      dot={false}
                      name={`${config.name} - ${metric.label}`}
                      yAxisId={metric.key}
                      isAnimationActive={false}
                    />
                  ))
                )
              : // Single sensor mode: render line for each selected metric
                selectedMetricsArray.map((metric) => (
                  <Line
                    key={metric.key}
                    type="monotone"
                    dataKey={metric.key}
                    stroke={metric.color}
                    strokeWidth={2}
                    dot={false}
                    name={metric.label}
                    yAxisId={metric.key}
                    isAnimationActive={false}
                  />
                ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

export default DetailChart
