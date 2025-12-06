import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'
import Sparkline from './Sparkline'

/**
 * @typedef {Object} DataPoint
 * @property {number} timestamp - Unix timestamp
 * @property {number} value - Data value
 */

/**
 * SensorHistoryRow - clickable row displaying sensor name, sparkline, and current value
 *
 * @param {Object} props
 * @param {string} props.name - Sensor display name
 * @param {string} props.mac - Sensor MAC address
 * @param {DataPoint[]} [props.data] - Historical data for sparkline
 * @param {number|null} [props.currentValue] - Current sensor value
 * @param {string} [props.unit] - Unit suffix (e.g., '°C', '%')
 * @param {(mac: string) => void} [props.onSelect] - Callback when row is clicked
 * @param {boolean} [props.selected] - Whether this row is selected
 * @param {string} [props.color] - Sparkline color
 * @param {string} [props.timeRange] - Time range for X-axis formatting
 * @returns {JSX.Element}
 */
const SensorHistoryRow = ({
  name,
  mac,
  data,
  currentValue,
  unit = '°C',
  onSelect,
  selected = false,
  color,
  timeRange = '24h',
}) => {
  /**
   * Handle row click
   */
  const handleClick = () => {
    if (onSelect) {
      onSelect(mac)
    }
  }

  /**
   * Format the current value for display
   * @returns {string}
   */
  const formatCurrentValue = () => {
    if (currentValue === null || currentValue === undefined) {
      return '-'
    }
    return `${currentValue}${unit}`
  }

  return (
    <ButtonBase
      onClick={handleClick}
      data-selected={selected}
      aria-label={`${name} sensor history`}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1,
        px: 1.5,
        borderRadius: 1,
        backgroundColor: selected ? 'rgba(34, 139, 34, 0.15)' : 'transparent',
        '&:hover': {
          backgroundColor: selected
            ? 'rgba(34, 139, 34, 0.2)'
            : 'rgba(255, 255, 255, 0.05)',
        },
        transition: 'background-color 0.2s',
      }}
    >
      {/* Sensor Name */}
      <Typography
        variant="body1"
        sx={{
          minWidth: 100,
          textAlign: 'left',
          fontWeight: selected ? 'medium' : 'normal',
        }}
      >
        {name}
      </Typography>

      {/* Sparkline */}
      <Box sx={{ flex: 1, mx: 2, minWidth: 0 }}>
        <Sparkline
          data={data}
          color={color}
          width="100%"
          height={100}
          timeRange={timeRange}
          showAxes
        />
      </Box>

      {/* Current Value */}
      <Typography
        variant="body1"
        sx={{
          minWidth: 60,
          textAlign: 'right',
          fontWeight: 'medium',
        }}
      >
        {formatCurrentValue()}
      </Typography>
    </ButtonBase>
  )
}

export default SensorHistoryRow
