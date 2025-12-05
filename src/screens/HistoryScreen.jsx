import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/**
 * History screen - displays historical sensor data with charts
 * @returns {JSX.Element}
 */
const HistoryScreen = () => (
  <Box px={2} pt={2} pb={0}>
    <Typography variant="h4" component="h1" gutterBottom>
      History
    </Typography>
    <Typography variant="body1">
      Historical sensor data will be displayed here.
    </Typography>
  </Box>
)

export default HistoryScreen
