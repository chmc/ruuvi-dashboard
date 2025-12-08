import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import formatters from '../utils/formatters'

/**
 * Get signal strength description based on RSSI
 * @param {number | null} rssi - RSSI value in dBm
 * @returns {string} - Signal strength description
 */
const getSignalStrengthLabel = (rssi) => {
  if (rssi === null) return ''
  if (rssi >= -50) return 'Excellent'
  if (rssi >= -60) return 'Good'
  if (rssi >= -70) return 'Fair'
  return 'Weak'
}

/**
 * Get color based on status
 * @param {'online' | 'stale' | 'offline'} status
 * @returns {'success' | 'warning' | 'error'}
 */
const getStatusColor = (status) => {
  switch (status) {
    case 'online':
      return 'success'
    case 'stale':
      return 'warning'
    case 'offline':
      return 'error'
    default:
      return 'default'
  }
}

/**
 * Format status text
 * @param {'online' | 'stale' | 'offline'} status
 * @returns {string}
 */
const formatStatus = (status) => {
  switch (status) {
    case 'online':
      return 'Online'
    case 'stale':
      return 'Stale'
    case 'offline':
      return 'Offline'
    default:
      return status
  }
}

/**
 * Sensor Health Indicator component
 * Displays sensor connection status, last seen time, and RSSI signal strength
 *
 * @param {Object} props
 * @param {string} props.name - Sensor display name
 * @param {number | null} props.lastSeen - Last seen timestamp (ms)
 * @param {number | null} props.rssi - Signal strength in dBm
 * @param {'online' | 'stale' | 'offline'} props.status - Sensor status
 * @returns {JSX.Element}
 */
const SensorHealthIndicator = ({ name, lastSeen, rssi, status }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      py: 0.75,
      borderBottom: '1px solid',
      borderColor: 'divider',
      '&:last-child': {
        borderBottom: 'none',
      },
    }}
  >
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="body2" fontWeight="medium" noWrap>
        {name}
      </Typography>
      <Typography variant="caption" color="text.secondary" component="div">
        {lastSeen ? formatters.toLocalDateTime(lastSeen) : 'Never seen'}
      </Typography>
      {rssi !== null && (
        <Typography variant="caption" color="text.secondary" component="div">
          {rssi} dBm ({getSignalStrengthLabel(rssi)})
        </Typography>
      )}
    </Box>

    <Chip
      label={formatStatus(status)}
      color={getStatusColor(status)}
      size="small"
      sx={{ ml: 1, minWidth: 60 }}
    />
  </Box>
)

export default SensorHealthIndicator
