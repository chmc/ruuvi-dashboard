import Alert from '@mui/material/Alert'

/**
 * Standardized error alert component
 * @param {Object} props
 * @param {string|null} props.error - Error message to display
 * @param {'error'|'warning'|'info'|'success'} [props.severity] - Alert severity level
 * @param {import('@mui/system').SxProps} [props.sx] - Additional MUI sx styles
 * @returns {JSX.Element|null}
 */
const ErrorAlert = ({ error, severity = 'error', sx = {} }) => {
  if (!error) {
    return null
  }

  return (
    <Alert data-testid="error-alert" severity={severity} sx={{ mb: 2, ...sx }}>
      {error}
    </Alert>
  )
}

export default ErrorAlert
