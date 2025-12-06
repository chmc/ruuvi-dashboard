import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import BatteryIndicator from '../components/BatteryIndicator'
import apiService from '../services/api'

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
const DiagnosticsScreen = ({ batteries = [] }) => {
  const [flushDialogOpen, setFlushDialogOpen] = useState(false)
  const [isFlushing, setIsFlushing] = useState(false)
  const [flushSuccess, setFlushSuccess] = useState(null)
  const [flushError, setFlushError] = useState(null)

  const handleFlushClick = () => {
    setFlushDialogOpen(true)
    setFlushSuccess(null)
    setFlushError(null)
  }

  const handleFlushConfirm = async () => {
    setFlushDialogOpen(false)
    setIsFlushing(true)
    setFlushSuccess(null)
    setFlushError(null)

    try {
      const result = await apiService.flushBuffer()
      setFlushSuccess(result.message || 'Buffer flushed successfully')
      setFlushError(null)
    } catch (error) {
      setFlushError(error.message || 'Failed to flush buffer')
      setFlushSuccess(null)
    } finally {
      setIsFlushing(false)
    }
  }

  const handleFlushCancel = () => {
    setFlushDialogOpen(false)
  }

  return (
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
              <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFlushClick}
                  disabled={isFlushing}
                  startIcon={isFlushing ? <CircularProgress size={20} /> : null}
                >
                  {isFlushing ? 'Flushing...' : 'Flush Buffer'}
                </Button>
                {flushSuccess && (
                  <Alert severity="success">{flushSuccess}</Alert>
                )}
                {flushError && <Alert severity="error">{flushError}</Alert>}
              </Box>
              {/* Additional buffer status content will be added in Task 6.4 */}
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

      {/* Flush Confirmation Dialog */}
      <Dialog
      open={flushDialogOpen}
      onClose={handleFlushCancel}
      aria-labelledby="flush-dialog-title"
      aria-describedby="flush-dialog-description"
    >
      <DialogTitle id="flush-dialog-title">Confirm Flush</DialogTitle>
      <DialogContent>
        <DialogContentText id="flush-dialog-description">
          Are you sure you want to flush the buffer? This will immediately write
          all buffered readings to the database.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleFlushCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleFlushConfirm} color="primary" variant="contained">
          Confirm
        </Button>
      </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DiagnosticsScreen
