import { useEffect } from 'react'
import Alert from '@mui/material/Alert'

/**
 * Standardized error alert component with optional auto-dismiss and close button
 * @param {Object} props
 * @param {string|null} props.error - Error message to display
 * @param {'error'|'warning'|'info'|'success'} [props.severity] - Alert severity level
 * @param {import('@mui/system').SxProps} [props.sx] - Additional MUI sx styles
 * @param {function(): void} [props.onDismiss] - Callback when alert is dismissed
 * @param {number} [props.autoDismissMs] - Auto-dismiss after this many milliseconds
 * @returns {JSX.Element|null}
 */
const ErrorAlert = ({
  error,
  severity = 'error',
  sx = {},
  onDismiss,
  autoDismissMs,
}) => {
  useEffect(() => {
    if (!error || !onDismiss || !autoDismissMs) {
      return undefined
    }

    const timer = setTimeout(() => {
      onDismiss()
    }, autoDismissMs)

    return () => clearTimeout(timer)
  }, [error, onDismiss, autoDismissMs])

  if (!error) {
    return null
  }

  return (
    <Alert
      data-testid="error-alert"
      severity={severity}
      sx={{ mb: 2, ...sx }}
      onClose={onDismiss}
    >
      {error}
    </Alert>
  )
}

export default ErrorAlert
