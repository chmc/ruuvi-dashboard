import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  XAxis,
  ReferenceLine,
} from 'recharts'

/**
 * @typedef {Object} DataPoint
 * @property {number} timestamp - Unix timestamp
 * @property {number} value - Data value
 */

/**
 * @typedef {Object} HistoryDataPoint
 * @property {number} timestamp - Unix timestamp
 * @property {number} temperature - Temperature in Celsius
 * @property {number} humidity - Humidity percentage
 * @property {number} pressure - Pressure in hPa
 */

/**
 * Metric configuration
 */
const METRICS = {
  temperature: { color: '#ff7043', unit: '°C', order: 0 },
  humidity: { color: '#42a5f5', unit: '%', order: 1 },
  pressure: { color: '#66bb6a', unit: 'hPa', order: 2 },
}

/**
 * Calculate Y-axis domain for a specific metric
 * @param {HistoryDataPoint[]} data - History data
 * @param {string} metricKey - Metric key (temperature, humidity, pressure)
 * @returns {[number, number]} Min and max values with padding
 */
const calculateMetricDomain = (data, metricKey) => {
  if (!data || data.length === 0) return [0, 1]
  const values = data.map((d) => d[metricKey]).filter((v) => v != null)
  if (values.length === 0) return [0, 1]
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue
  const padding = range > 0 ? range * 0.1 : 1
  return [
    Math.floor((minValue - padding) * 10) / 10,
    Math.ceil((maxValue + padding) * 10) / 10,
  ]
}

/**
 * Default line color (MUI primary blue)
 */
const DEFAULT_COLOR = '#1976d2'

/**
 * Format timestamp for X-axis display
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {string} timeRange - Selected time range
 * @returns {string} Formatted time string
 */
const formatXAxis = (timestamp, timeRange) => {
  const date = new Date(timestamp)
  if (timeRange === '1h' || timeRange === '6h' || timeRange === '24h') {
    return date.toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  // For 7d, 30d, all - show date
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' })
}

/**
 * Sparkline component - line chart with Y-axis range and X-axis time indicators
 * Supports both single-metric (legacy) and multi-metric modes.
 *
 * @param {Object} props
 * @param {DataPoint[]} [props.data] - Legacy: Array of data points with timestamp and value
 * @param {HistoryDataPoint[]} [props.historyData] - Full history data with all metrics
 * @param {string[]} [props.selectedMetrics] - Array of metric keys to display (default: ['temperature'])
 * @param {string} [props.color] - Line color for legacy mode (default: MUI primary blue)
 * @param {number|string} [props.width] - Chart width in pixels or '100%' (default: 100)
 * @param {number} [props.height] - Chart height in pixels (default: 80)
 * @param {boolean} [props.showValue] - Whether to display current value (legacy mode)
 * @param {string} [props.unit] - Unit suffix for value display (legacy mode)
 * @param {number} [props.decimals] - Number of decimal places for value (default: 1)
 * @param {string} [props.timeRange] - Time range for X-axis formatting (e.g., '1h', '24h', '7d')
 * @param {boolean} [props.showAxes] - Whether to show axes (default: true)
 * @returns {JSX.Element}
 */
const Sparkline = ({
  data,
  historyData,
  selectedMetrics = ['temperature'],
  color = DEFAULT_COLOR,
  width = 100,
  height = 80,
  showValue = false,
  unit = '',
  decimals = 1,
  timeRange = '24h',
  showAxes = true,
}) => {
  // Determine if we're in multi-metric mode
  const isMultiMetricMode = historyData && selectedMetrics.length > 0

  // Normalize data based on mode
  const normalizedData = isMultiMetricMode ? historyData || [] : data || []

  // For legacy mode, get current value
  const currentValue =
    !isMultiMetricMode && normalizedData.length > 0
      ? normalizedData[normalizedData.length - 1].value
      : null

  // Calculate Y-axis domain for legacy single-value mode
  const calculateLegacyYDomain = () => {
    if (normalizedData.length === 0) return [0, 1]
    const values = normalizedData.map((d) => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue
    const padding = range > 0 ? range * 0.1 : 1
    return [
      Math.floor((minValue - padding) * 10) / 10,
      Math.ceil((maxValue + padding) * 10) / 10,
    ]
  }

  // For legacy mode
  const [yMin, yMax] = isMultiMetricMode ? [0, 1] : calculateLegacyYDomain()
  const yMid = Math.round(((yMin + yMax) / 2) * 10) / 10
  const yTicks = [yMin, yMid, yMax]

  // Calculate domains for each selected metric in multi-metric mode
  const metricDomains = isMultiMetricMode
    ? selectedMetrics.reduce((acc, metricKey) => {
        acc[metricKey] = calculateMetricDomain(normalizedData, metricKey)
        return acc
      }, {})
    : {}

  /**
   * Format the current value with decimals and unit
   * @returns {string}
   */
  const formatValue = () => {
    if (currentValue === null) return ''
    const rounded =
      decimals > 0
        ? Number(currentValue.toFixed(decimals))
        : Math.round(currentValue)
    return `${rounded}${unit}`
  }

  /**
   * Format Y-axis tick values
   * @param {number} value
   * @returns {string}
   */
  const formatYAxis = (value) => value.toFixed(1)

  // Handle width as either number (pixels) or string ('100%')
  const widthStyle = typeof width === 'number' ? `${width}px` : width

  /**
   * Get evenly distributed X-axis ticks based on time range
   * @returns {number[]} Array of timestamps for tick marks
   */
  const getXTicks = () => {
    if (normalizedData.length < 2) return []
    const first = normalizedData[0].timestamp
    const last = normalizedData[normalizedData.length - 1].timestamp
    const duration = last - first

    // Determine number of ticks based on time range
    let tickCount
    switch (timeRange) {
      case '1h':
        tickCount = 4 // Every 15 minutes
        break
      case '6h':
        tickCount = 6 // Every hour
        break
      case '24h':
        tickCount = 6 // Every 4 hours
        break
      case '7d':
        tickCount = 7 // Every day
        break
      case '30d':
        tickCount = 6 // Every 5 days
        break
      default:
        tickCount = 5
    }

    // Generate evenly spaced ticks
    const ticks = []
    for (let i = 0; i < tickCount; i += 1) {
      const tick = first + (duration * i) / (tickCount - 1)
      ticks.push(Math.round(tick))
    }
    return ticks
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Box
        data-testid="sparkline-wrapper"
        sx={{ width: widthStyle, height: `${height}px` }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={normalizedData}
            margin={
              showAxes
                ? { top: 5, right: 5, left: 0, bottom: 20 }
                : { top: 2, right: 2, left: 2, bottom: 2 }
            }
          >
            {/* Legacy single-metric Y-axis */}
            {showAxes && !isMultiMetricMode && (
              <YAxis
                domain={[yMin, yMax]}
                ticks={yTicks}
                tickFormatter={formatYAxis}
                tick={{ fontSize: 10, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
            )}
            {/* Multi-metric Y-axes - one per metric with its own scale */}
            {showAxes &&
              isMultiMetricMode &&
              selectedMetrics.map((metricKey) => {
                const [metricMin, metricMax] = metricDomains[metricKey] || [0, 1]
                const metricMid =
                  Math.round(((metricMin + metricMax) / 2) * 10) / 10
                // Compact width for each axis
                const axisWidth = 32
                return (
                  <YAxis
                    key={metricKey}
                    yAxisId={metricKey}
                    domain={[metricMin, metricMax]}
                    ticks={[metricMin, metricMid, metricMax]}
                    tickFormatter={formatYAxis}
                    tick={{ fontSize: 9, fill: METRICS[metricKey]?.color || '#888' }}
                    axisLine={false}
                    tickLine={false}
                    width={axisWidth}
                    orientation="left"
                  />
                )
              })}
            {showAxes && (
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(ts) => formatXAxis(ts, timeRange)}
                tick={{ fontSize: 10, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                ticks={getXTicks()}
                height={18}
                scale="time"
              />
            )}
            {/* Reference line at middle value - only for legacy mode */}
            {showAxes && !isMultiMetricMode && normalizedData.length > 0 && (
              <ReferenceLine y={yMid} stroke="#444" strokeDasharray="3 3" />
            )}
            {/* Reference lines for multi-metric mode - one per metric */}
            {showAxes &&
              isMultiMetricMode &&
              normalizedData.length > 0 &&
              selectedMetrics.map((metricKey) => {
                const [metricMin, metricMax] = metricDomains[metricKey] || [0, 1]
                const metricMid =
                  Math.round(((metricMin + metricMax) / 2) * 10) / 10
                return (
                  <ReferenceLine
                    key={`ref-${metricKey}`}
                    y={metricMid}
                    yAxisId={metricKey}
                    stroke={METRICS[metricKey]?.color || '#444'}
                    strokeDasharray="3 3"
                    strokeOpacity={0.3}
                  />
                )
              })}

            {/* Render lines based on mode */}
            {isMultiMetricMode
              ? selectedMetrics.map((metricKey) => (
                  <Line
                    key={metricKey}
                    type="monotone"
                    dataKey={metricKey}
                    yAxisId={metricKey}
                    stroke={METRICS[metricKey]?.color || DEFAULT_COLOR}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))
              : // Legacy single-value mode
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
            }
          </LineChart>
        </ResponsiveContainer>
      </Box>
      {showValue && currentValue !== null && (
        <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
          {formatValue()}
        </Typography>
      )}
    </Box>
  )
}

export default Sparkline
