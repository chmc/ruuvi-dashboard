import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'
import Sparkline from './Sparkline'

/**
 * @typedef {Object} HistoryDataPoint
 * @property {number} timestamp - Unix timestamp
 * @property {number} temperature - Temperature in Celsius
 * @property {number} humidity - Humidity percentage
 * @property {number} pressure - Pressure in hPa
 */

/**
 * Metric configuration with colors and units
 */
const METRICS = {
  temperature: { color: '#ff7043', unit: '°C' },
  humidity: { color: '#42a5f5', unit: '%' },
  pressure: { color: '#66bb6a', unit: 'hPa' },
}

/**
 * SensorHistoryRow - clickable row displaying sensor name, sparkline, and current value
 *
 * @param {Object} props
 * @param {string} props.name - Sensor display name
 * @param {string} props.mac - Sensor MAC address
 * @param {HistoryDataPoint[]} [props.historyData] - Full history data with all metrics
 * @param {string[]} [props.selectedMetrics] - Array of selected metric keys to display
 * @param {(mac: string) => void} [props.onSelect] - Callback when row is clicked
 * @param {boolean} [props.selected] - Whether this row is selected
 * @param {string} [props.timeRange] - Time range for X-axis formatting
 * @param {number} [props.sensorCount] - Total number of sensors (for dynamic height)
 * @returns {JSX.Element}
 */
const SensorHistoryRow = ({
  name,
  mac,
  historyData,
  selectedMetrics = ['temperature'],
  onSelect,
  selected = false,
  timeRange = '24h',
  sensorCount = 1,
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
   * Get current (latest) values for selected metrics
   * @returns {Array<{metric: string, value: string, color: string}>} Formatted current values with colors
   */
  const getCurrentValues = () => {
    if (!historyData || historyData.length === 0) return null
    const latest = historyData[historyData.length - 1]

    return selectedMetrics.map((metric) => {
      const value = latest[metric]
      const config = METRICS[metric]
      if (value === null || value === undefined) {
        return { metric, value: '-', color: config?.color || '#888' }
      }
      const rounded = Math.round(value * 10) / 10
      return {
        metric,
        value: `${rounded}${config?.unit || ''}`,
        color: config?.color || '#888',
      }
    })
  }

  const currentValues = getCurrentValues()

  return (
    <ButtonBase
      onClick={handleClick}
      data-selected={selected}
      aria-label={`${name} sensor history`}
      sx={{
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.5,
        px: 1.5,
        borderRadius: 1,
        minHeight: 0,
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
      <Box sx={{ flex: 1, mx: 2, minWidth: 0, height: '100%' }}>
        <Sparkline
          historyData={historyData}
          selectedMetrics={selectedMetrics}
          width="100%"
          height="100%"
          timeRange={timeRange}
          showAxes
        />
      </Box>

      {/* Current Value(s) */}
      <Box
        sx={{
          minWidth: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 0.25,
        }}
      >
        {currentValues ? (
          currentValues.map(({ metric, value, color }) => (
            <Typography
              key={metric}
              variant="body2"
              sx={{
                color,
                fontWeight: 'medium',
                fontSize: '0.875rem',
                lineHeight: 1.3,
              }}
            >
              {value}
            </Typography>
          ))
        ) : (
          <Typography
            variant="body2"
            sx={{ color: '#888', fontWeight: 'medium' }}
          >
            -
          </Typography>
        )}
      </Box>
    </ButtonBase>
  )
}

export default SensorHistoryRow
