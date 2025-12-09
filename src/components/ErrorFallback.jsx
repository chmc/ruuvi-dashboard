import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'

/**
 * Fallback UI displayed when ErrorBoundary catches an error
 * @param {Object} props
 * @param {Error} props.error - The error that was caught
 * @param {Function} [props.onReset] - Optional callback to reset the error boundary
 * @returns {JSX.Element}
 */
const ErrorFallback = ({ error, onReset }) => {
  const handleReload = () => {
    if (onReset) {
      onReset()
    }
    window.location.reload()
  }

  return (
    <Container maxWidth="sm" data-testid="error-fallback">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {error.message}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleReload}>
            Reload Page
          </Button>
          <Button variant="outlined" component={RouterLink} to="/">
            Go to Dashboard
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default ErrorFallback
