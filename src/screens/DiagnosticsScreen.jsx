import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import BatteryIndicator from '../components/BatteryIndicator'

/**
 * @typedef {Object} BatteryData
 * @property {string} mac - MAC address
 * @property {number | null} voltage - Battery voltage in volts
 * @property {number | null} lastSeen - Timestamp of last reading
 */

/**
 * Diagnostics screen - displays system status and buffer information
 * @param {Object} props
 * @param {BatteryData[]} [props.batteries] - Array of battery data
 * @returns {JSX.Element}
 */
const DiagnosticsScreen = ({ batteries = [] }) => (
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
            <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
              {batteries.length > 0 ? (
                batteries.map((battery) => (
                  <BatteryIndicator
                    key={battery.mac}
                    mac={battery.mac}
                    voltage={battery.voltage}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No battery data available
                </Typography>
              )}
            </Box>
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
