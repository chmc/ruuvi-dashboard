import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import configs from '../configs'

/**
 * Battery voltage thresholds
 */
const BATTERY_MIN = 2.0 // Minimum voltage (0%)
const BATTERY_MAX = 3.3 // Maximum voltage (100%)
const BATTERY_OK_THRESHOLD = 2.7 // OK status threshold
const BATTERY_LOW_THRESHOLD = 2.5 // Low status threshold

/**
 * Get battery status and color based on voltage
 * @param {number | null} voltage
 * @returns {{ status: string, color: string }}
 */
const getBatteryStatus = (voltage) => {
  if (voltage === null || voltage === undefined) {
    return { status: 'Unknown', color: '#9e9e9e' } // gray
  }

  if (voltage >= BATTERY_OK_THRESHOLD) {
    return { status: 'OK', color: '#4caf50' } // green
  }

  if (voltage >= BATTERY_LOW_THRESHOLD) {
    return { status: 'Low', color: '#ff9800' } // yellow/orange
  }

  return { status: 'Critical', color: '#f44336' } // red
}

/**
 * Calculate battery percentage from voltage
 * @param {number | null} voltage
 * @returns {number}
 */
const calculateBatteryPercentage = (voltage) => {
  if (voltage === null || voltage === undefined) {
    return 0
  }

  const clampedVoltage = Math.max(BATTERY_MIN, Math.min(BATTERY_MAX, voltage))
  const percentage =
    ((clampedVoltage - BATTERY_MIN) / (BATTERY_MAX - BATTERY_MIN)) * 100
  return Math.round(percentage)
}

/**
 * Format voltage value for display
 * @param {number | null} voltage
 * @returns {string}
 */
const formatVoltage = (voltage) => {
  if (voltage === null || voltage === undefined) {
    return '-'
  }

  return `${voltage.toFixed(1)} V`
}

/**
 * Get sensor name from MAC address
 * @param {string} mac
 * @returns {string}
 */
const getSensorName = (mac) => {
  const normalizedMac = mac?.toLowerCase() || ''
  const ruuviTag = configs.ruuviTags.find(
    (tag) => tag.mac.toLowerCase() === normalizedMac
  )

  return ruuviTag?.name || mac
}

/**
 * BatteryIndicator component displays battery level with visual bar
 * @param {Object} props
 * @param {string} props.mac - MAC address of the sensor
 * @param {number | null} props.voltage - Battery voltage in volts
 */
const BatteryIndicator = ({ mac, voltage }) => {
  const sensorName = getSensorName(mac)
  const percentage = calculateBatteryPercentage(voltage)
  const { status, color } = getBatteryStatus(voltage)

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={0.5}
      >
        <Typography variant="body2" component="div">
          {sensorName}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            {formatVoltage(voltage)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color,
              fontWeight: 'medium',
            }}
          >
            {status}
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 4,
          },
        }}
      />
    </Box>
  )
}

export default BatteryIndicator
