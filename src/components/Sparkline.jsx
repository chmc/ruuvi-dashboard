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
 *
 * @param {Object} props
 * @param {DataPoint[]} [props.data] - Array of data points with timestamp and value
 * @param {string} [props.color] - Line color (default: MUI primary blue)
 * @param {number|string} [props.width] - Chart width in pixels or '100%' (default: 100)
 * @param {number} [props.height] - Chart height in pixels (default: 80)
 * @param {boolean} [props.showValue] - Whether to display current value
 * @param {string} [props.unit] - Unit suffix for value display (e.g., '°C', '%')
 * @param {number} [props.decimals] - Number of decimal places for value (default: 1)
 * @param {string} [props.timeRange] - Time range for X-axis formatting (e.g., '1h', '24h', '7d')
 * @param {boolean} [props.showAxes] - Whether to show axes (default: true)
 * @returns {JSX.Element}
 */
const Sparkline = ({
  data,
  color = DEFAULT_COLOR,
  width = 100,
  height = 80,
  showValue = false,
  unit = '',
  decimals = 1,
  timeRange = '24h',
  showAxes = true,
}) => {
  // Normalize data to empty array if null/undefined
  const normalizedData = data || []

  // Get current (latest) value from data
  const currentValue =
    normalizedData.length > 0
      ? normalizedData[normalizedData.length - 1].value
      : null

  // Calculate min/max for Y-axis with padding
  const values = normalizedData.map((d) => d.value)
  const minValue = values.length > 0 ? Math.min(...values) : 0
  const maxValue = values.length > 0 ? Math.max(...values) : 0
  const range = maxValue - minValue
  const padding = range > 0 ? range * 0.1 : 1
  const yMin = Math.floor((minValue - padding) * 10) / 10
  const yMax = Math.ceil((maxValue + padding) * 10) / 10

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

  // Calculate the middle value for the reference line
  const yMid = Math.round(((yMin + yMax) / 2) * 10) / 10

  // Y-axis ticks: min, mid, max - ensures reference line always has a label
  const yTicks = [yMin, yMid, yMax]

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
                ? { top: 5, right: 5, left: 35, bottom: 20 }
                : { top: 2, right: 2, left: 2, bottom: 2 }
            }
          >
            {showAxes && (
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
            {/* Reference line at middle value */}
            {showAxes && normalizedData.length > 0 && (
              <ReferenceLine y={yMid} stroke="#444" strokeDasharray="3 3" />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
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
