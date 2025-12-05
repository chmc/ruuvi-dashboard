import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ResponsiveContainer, LineChart, Line } from 'recharts'

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
 * Sparkline component - minimal line chart for quick data overview
 *
 * @param {Object} props
 * @param {DataPoint[]} [props.data] - Array of data points with timestamp and value
 * @param {string} [props.color] - Line color (default: MUI primary blue)
 * @param {number} [props.width] - Chart width in pixels (default: 100)
 * @param {number} [props.height] - Chart height in pixels (default: 40)
 * @param {boolean} [props.showValue] - Whether to display current value
 * @param {string} [props.unit] - Unit suffix for value display (e.g., '°C', '%')
 * @param {number} [props.decimals] - Number of decimal places for value (default: 0)
 * @returns {JSX.Element}
 */
const Sparkline = ({
  data,
  color = DEFAULT_COLOR,
  width = 100,
  height = 40,
  showValue = false,
  unit = '',
  decimals = 0,
}) => {
  // Normalize data to empty array if null/undefined
  const normalizedData = data || []

  // Get current (latest) value from data
  const currentValue =
    normalizedData.length > 0
      ? normalizedData[normalizedData.length - 1].value
      : null

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

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Box
        data-testid="sparkline-wrapper"
        sx={{ width: `${width}px`, height: `${height}px` }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={normalizedData}>
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
