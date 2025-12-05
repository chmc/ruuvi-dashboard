import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TrendingUp from '@mui/icons-material/TrendingUp'
import TrendingDown from '@mui/icons-material/TrendingDown'
import TrendingFlat from '@mui/icons-material/TrendingFlat'
import NorthEast from '@mui/icons-material/NorthEast'
import SouthEast from '@mui/icons-material/SouthEast'

/**
 * @typedef {'rising' | 'rising-slightly' | 'stable' | 'falling-slightly' | 'falling'} TrendDirection
 */

/**
 * Get the arrow icon component and CSS class for a trend direction
 * @param {TrendDirection} direction
 * @returns {{ Icon: JSX.Element, className: string }}
 */
const getArrowConfig = (direction) => {
  switch (direction) {
    case 'rising':
      return { Icon: TrendingUp, className: 'trend-rising' }
    case 'rising-slightly':
      return { Icon: NorthEast, className: 'trend-rising' }
    case 'stable':
      return { Icon: TrendingFlat, className: 'trend-stable' }
    case 'falling-slightly':
      return { Icon: SouthEast, className: 'trend-falling' }
    case 'falling':
      return { Icon: TrendingDown, className: 'trend-falling' }
    default:
      return { Icon: TrendingFlat, className: 'trend-stable' }
  }
}

/**
 * Format delta value with sign and decimal
 * @param {number} delta
 * @param {string} [unit]
 * @returns {string}
 */
const formatDelta = (delta, unit = '') => {
  const roundedDelta = Math.round(delta * 10) / 10
  const sign = roundedDelta > 0 ? '+' : ''
  return `${sign}${roundedDelta.toFixed(1)}${unit}`
}

/**
 * Get color for trend direction
 * @param {string} className
 * @returns {string}
 */
const getColor = (className) => {
  switch (className) {
    case 'trend-rising':
      return '#4caf50' // green
    case 'trend-falling':
      return '#f44336' // red
    case 'trend-stable':
    default:
      return '#9e9e9e' // gray
  }
}

/**
 * TrendIndicator component displays a trend arrow with delta value
 * @param {Object} props
 * @param {TrendDirection} [props.direction] - Trend direction
 * @param {number} [props.delta] - Change value
 * @param {string} [props.unit] - Unit suffix (e.g., '%', '°C')
 */
const TrendIndicator = ({ direction, delta, unit }) => {
  // Return null if no trend data available
  if (!direction) {
    return null
  }

  const { Icon, className } = getArrowConfig(direction)
  const color = getColor(className)

  return (
    <Box display="inline-flex" alignItems="center" gap={0.25}>
      <Icon
        data-testid={`trend-arrow-${direction}`}
        className={className}
        sx={{ fontSize: 16, color }}
      />
      <Typography
        variant="caption"
        sx={{ color, fontSize: '0.7rem', lineHeight: 1 }}
      >
        {formatDelta(delta, unit)}
      </Typography>
    </Box>
  )
}

export default TrendIndicator
