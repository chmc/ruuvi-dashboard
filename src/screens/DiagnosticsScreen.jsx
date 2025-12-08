import { useState, useEffect } from 'react'
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
import SensorHealthIndicator from '../components/SensorHealthIndicator'
import apiService from '../services/api'
import configs from '../configs'
import formatters from '../utils/formatters'

/**
 * @typedef {Object} DiagnosticsData
 * @property {number} bufferSize - Number of readings in buffer
 * @property {number | null} lastFlushTime - Timestamp of last flush
 * @property {Array<{mac: string, voltage: number | null, lastSeen: number | null}>} batteries - Battery levels for sensors
 * @property {Array<{mac: string, lastSeen: number | null, rssi: number | null, status: 'online' | 'stale' | 'offline'}>} sensorHealth - Sensor health data
 * @property {number} dbSize - Database size in bytes
 * @property {number | null} oldestRecord - Timestamp of oldest record
 * @property {number} uptime - Server uptime in milliseconds
 */

/**
 * Format bytes to human-readable string
 * @param {number} bytes
 * @returns {string}
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

/**
 * Format uptime in milliseconds to human-readable string
 * @param {number} ms
 * @returns {string}
 */
const formatUptime = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

/**
 * Diagnostics screen - displays system status and buffer information
 * @returns {JSX.Element}
 */
const DiagnosticsScreen = () => {
  const [diagnostics, setDiagnostics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [flushDialogOpen, setFlushDialogOpen] = useState(false)
  const [isFlushing, setIsFlushing] = useState(false)
  const [flushSuccess, setFlushSuccess] = useState(null)
  const [flushError, setFlushError] = useState(null)

  const fetchDiagnostics = async () => {
    try {
      setError(null)
      const macs = configs.macIds || []
      const data = await apiService.getDiagnostics(macs)
      setDiagnostics(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch diagnostics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnostics()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDiagnostics()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

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
      // Refresh diagnostics after flush
      await fetchDiagnostics()
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

  if (loading) {
    return (
      <Box
        px={2}
        pt={2}
        pb={0}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error && !diagnostics) {
    return (
      <Box px={2} pt={2} pb={0}>
        <Typography variant="h4" component="h1" gutterBottom>
          Diagnostics
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  const batteries = diagnostics?.batteries || []
  const sensorHealth = diagnostics?.sensorHealth || []

  return (
    <Box px={2} pt={2} pb={0}>
      <Typography variant="h4" component="h1" gutterBottom>
        Diagnostics
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Buffer Status Section */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Buffer Status
              </Typography>
              <Box display="flex" flexDirection="column" gap={1} mt={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Buffer Size:
                  </Typography>
                  <Typography variant="body1">
                    {diagnostics?.bufferSize ?? 0} readings
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Flush:
                  </Typography>
                  <Typography variant="body1">
                    {diagnostics?.lastFlushTime
                      ? formatters.toLocalDateTime(diagnostics.lastFlushTime)
                      : 'Never'}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handleFlushClick}
                  disabled={isFlushing}
                  startIcon={isFlushing ? <CircularProgress size={16} /> : null}
                  sx={{ mt: 1 }}
                >
                  {isFlushing ? 'Flushing...' : 'Flush Buffer'}
                </Button>
                {flushSuccess && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    {flushSuccess}
                  </Alert>
                )}
                {flushError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {flushError}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sensor Health Section */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Sensor Health
              </Typography>
              <Box>
                {sensorHealth.length > 0 ? (
                  sensorHealth.map((sensor) => {
                    const sensorName =
                      configs.ruuviTags.find((tag) => tag.mac === sensor.mac)
                        ?.name || sensor.mac
                    return (
                      <SensorHealthIndicator
                        key={sensor.mac}
                        name={sensorName}
                        lastSeen={sensor.lastSeen}
                        rssi={sensor.rssi}
                        status={sensor.status}
                      />
                    )
                  })
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No sensor health data available
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Battery Levels Section */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Battery Levels
              </Typography>
              <Box display="flex" flexDirection="column" gap={1} mt={1}>
                {batteries.length > 0 ? (
                  batteries.map((battery) => {
                    const sensorName =
                      configs.ruuviTags.find((tag) => tag.mac === battery.mac)
                        ?.name || battery.mac
                    return (
                      <BatteryIndicator
                        key={battery.mac}
                        mac={sensorName}
                        voltage={battery.voltage}
                      />
                    )
                  })
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
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                System Info
              </Typography>
              <Box display="flex" flexDirection="column" gap={1} mt={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Database Size:
                  </Typography>
                  <Typography variant="body1">
                    {diagnostics?.dbSize
                      ? formatBytes(diagnostics.dbSize)
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Oldest Record:
                  </Typography>
                  <Typography variant="body1">
                    {diagnostics?.oldestRecord
                      ? formatters.toLocalDateTime(diagnostics.oldestRecord)
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Server Uptime:
                  </Typography>
                  <Typography variant="body1">
                    {diagnostics?.uptime
                      ? formatUptime(diagnostics.uptime)
                      : 'N/A'}
                  </Typography>
                </Box>
              </Box>
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
            Are you sure you want to flush the buffer? This will immediately
            write all buffered readings to the database.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFlushCancel} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleFlushConfirm}
            color="primary"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DiagnosticsScreen
