import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import formatters from '../utils/formatters'

/**
 * @typedef {'ok' | 'error' | 'unknown'} ApiStatus
 */

/**
 * @typedef {Object} ApiStatusData
 * @property {ApiStatus} status - Current status
 * @property {number | null} lastSuccess - Timestamp of last successful fetch
 * @property {number | null} lastError - Timestamp of last error
 * @property {string | null} errorMessage - Last error message
 */

/**
 * Get chip color based on status
 * @param {ApiStatus} status
 * @returns {'success' | 'error' | 'default'}
 */
const getStatusColor = (status) => {
  switch (status) {
    case 'ok':
      return 'success'
    case 'error':
      return 'error'
    case 'unknown':
    default:
      return 'default'
  }
}

/**
 * Get status label
 * @param {ApiStatus} status
 * @returns {string}
 */
const getStatusLabel = (status) => {
  switch (status) {
    case 'ok':
      return 'OK'
    case 'error':
      return 'Error'
    case 'unknown':
    default:
      return 'Unknown'
  }
}

/**
 * API Status Indicator component
 * Displays the status of an external API with last success/error times
 *
 * @param {Object} props
 * @param {string} props.name - API name to display
 * @param {ApiStatusData} props.statusData - Status data for the API
 * @returns {JSX.Element}
 */
const ApiStatusIndicator = ({ name, statusData }) => {
  const { status, lastSuccess, lastError, errorMessage } = statusData || {
    status: 'unknown',
    lastSuccess: null,
    lastError: null,
    errorMessage: null,
  }

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      py={0.5}
    >
      <Box flex={1}>
        <Typography variant="body2" noWrap>
          {name}
        </Typography>
        {lastSuccess && (
          <Typography variant="caption" color="text.secondary">
            Last success: {formatters.toLocalDateTime(lastSuccess)}
          </Typography>
        )}
        {status === 'error' && errorMessage && (
          <Typography variant="caption" color="error" display="block">
            {errorMessage}
          </Typography>
        )}
      </Box>
      <Chip
        label={getStatusLabel(status)}
        color={getStatusColor(status)}
        size="small"
        sx={{ ml: 1 }}
      />
    </Box>
  )
}

export default ApiStatusIndicator
