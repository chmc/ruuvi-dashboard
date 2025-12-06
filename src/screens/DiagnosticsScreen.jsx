import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

/**
 * Diagnostics screen - displays system status and buffer information
 * @returns {JSX.Element}
 */
const DiagnosticsScreen = () => (
  <Box px={2} pt={2} pb={0}>
    <Typography variant="h4" component="h1" gutterBottom>
      Diagnostics
    </Typography>

    <Grid container spacing={1.5} sx={{ mt: 1 }}>
      {/* Buffer Status Section */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              Buffer Status
            </Typography>
            {/* Buffer status content will be added in Task 6.4 */}
          </CardContent>
        </Card>
      </Grid>

      {/* Battery Levels Section */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              Battery Levels
            </Typography>
            {/* Battery levels content will be added in Task 6.2 */}
          </CardContent>
        </Card>
      </Grid>

      {/* System Info Section */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              System Info
            </Typography>
            {/* System info content will be added in Task 6.4 */}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
)

export default DiagnosticsScreen
