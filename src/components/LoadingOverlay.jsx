import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

/**
 * Standardized loading overlay component
 * @param {Object} props
 * @param {boolean} props.loading - Whether to show the loading state
 * @param {string} [props.message] - Optional message to display below spinner
 * @param {boolean} [props.fullScreen] - Whether to use full-screen centered layout
 * @param {number} [props.size] - Size of the CircularProgress spinner
 * @returns {JSX.Element|null}
 */
const LoadingOverlay = ({
  loading,
  message,
  fullScreen = false,
  size = 40,
}) => {
  if (!loading) {
    return null
  }

  return (
    <Box
      data-testid="loading-overlay"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      py={fullScreen ? 0 : 4}
      sx={fullScreen ? { minHeight: '400px' } : undefined}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  )
}

export default LoadingOverlay
