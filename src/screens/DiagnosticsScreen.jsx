import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/**
 * Diagnostics screen - displays system status and buffer information
 * @returns {JSX.Element}
 */
const DiagnosticsScreen = () => (
  <Box px={2} pt={2} pb={0}>
    <Typography variant="h4" component="h1" gutterBottom>
      Diagnostics
    </Typography>
    <Typography variant="body1">
      System diagnostics and status will be displayed here.
    </Typography>
  </Box>
)

export default DiagnosticsScreen
