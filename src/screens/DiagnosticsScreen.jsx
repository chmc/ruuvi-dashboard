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
import Chip from '@mui/material/Chip'
import BatteryIndicator from '../components/BatteryIndicator'
import SensorHealthIndicator from '../components/SensorHealthIndicator'
import ApiStatusIndicator from '../components/ApiStatusIndicator'
import LoadingOverlay from '../components/LoadingOverlay'
import ErrorAlert from '../components/ErrorAlert'
import usePollingData from '../hooks/usePollingData'
import useErrorLog from '../hooks/useErrorLog'
import apiService from '../services/api'
import configs from '../configs'
import formatters from '../utils/formatters'

/**
 * @typedef {Object} SystemResources
 * @property {{heapUsed: number, heapTotal: number, rss: number, external: number}} memory - Memory usage
 * @property {string} nodeVersion - Node.js version
 * @property {{free: number, total: number}} disk - Disk space
 */

/**
 * @typedef {Object} ApiStatusEntry
 * @property {'ok' | 'error' | 'unknown'} status - Current status
 * @property {number | null} lastSuccess - Timestamp of last successful fetch
 * @property {number | null} lastError - Timestamp of last error
 * @property {string | null} errorMessage - Last error message
 */

/**
 * @typedef {Object} ExternalApisStatus
 * @property {ApiStatusEntry} energyPrices - Energy prices API status
 * @property {ApiStatusEntry} openWeatherMap - OpenWeatherMap API status
 */

/**
 * @typedef {Object} DbStats
 * @property {number} totalRecords - Total number of records in database
 * @property {Array<{mac: string, count: number}>} recordsByMac - Records per sensor
 * @property {number | null} growthRatePerDay - Storage growth rate in bytes per day
 * @property {number | null} lastWriteTime - Timestamp of last successful DB write
 */

/**
 * @typedef {Object} FlushHistoryEntry
 * @property {number} timestamp - When the flush occurred
 * @property {number} count - Number of records flushed
 * @property {number} durationMs - How long the flush took in milliseconds
 */

/**
 * @typedef {Object} TodayMinMax
 * @property {number | null} minTemperature - Minimum temperature recorded today
 * @property {number | null} maxTemperature - Maximum temperature recorded today
 * @property {number | null} minHumidity - Minimum humidity recorded today
 * @property {number | null} maxHumidity - Maximum humidity recorded today
 */

/**
 * @typedef {Object} ReadingFrequencyEntry
 * @property {string} mac - Sensor MAC address
 * @property {number} readingsPerHour - Average readings per hour
 */

/**
 * @typedef {Object} DataGap
 * @property {number} startTime - Gap start timestamp
 * @property {number} endTime - Gap end timestamp
 * @property {number} gapDurationMs - Gap duration in milliseconds
 */

/**
 * @typedef {Object} DataQuality
 * @property {number} outOfRangeCount - Number of out-of-range readings in database
 * @property {TodayMinMax} todayMinMax - Min/max values recorded today
 * @property {ReadingFrequencyEntry[]} readingFrequency - Reading frequency per sensor
 * @property {Object.<string, DataGap[]>} dataGaps - Data gaps per sensor
 */

/**
 * @typedef {Object} DiagnosticsData
 * @property {number} bufferSize - Number of readings in buffer
 * @property {number | null} lastFlushTime - Timestamp of last flush
 * @property {Array<{mac: string, voltage: number | null, lastSeen: number | null}>} batteries - Battery levels for sensors
 * @property {Array<{mac: string, lastSeen: number | null, rssi: number | null, status: 'online' | 'stale' | 'offline'}>} sensorHealth - Sensor health data
 * @property {number} dbSize - Database size in bytes
 * @property {number | null} oldestRecord - Timestamp of oldest record
 * @property {number} uptime - Server uptime in milliseconds
 * @property {SystemResources} systemResources - System resource information
 * @property {ExternalApisStatus} externalApis - External API status information
 * @property {DbStats} dbStats - Database statistics
 * @property {FlushHistoryEntry[]} flushHistory - Recent flush history
 * @property {DataQuality} dataQuality - Data quality metrics
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
 * Format number with thousand separators
 * @param {number} num
 * @returns {string}
 */
const formatNumber = (num) => num.toLocaleString()

/** @type {number} Polling interval for diagnostics (30 seconds) */
const DIAGNOSTICS_POLL_INTERVAL = 30000

/**
 * Diagnostics screen - displays system status and buffer information
 * @returns {JSX.Element}
 */
const DiagnosticsScreen = () => {
  const [flushDialogOpen, setFlushDialogOpen] = useState(false)
  const [isFlushing, setIsFlushing] = useState(false)
  const [flushSuccess, setFlushSuccess] = useState(null)
  const [flushError, setFlushError] = useState(null)

  const { errors: errorLog, clearErrors } = useErrorLog()

  const macs = configs.macIds || []

  const {
    data: diagnostics,
    loading,
    error,
    refetch,
  } = usePollingData(() => apiService.getDiagnostics(macs), {
    interval: DIAGNOSTICS_POLL_INTERVAL,
  })

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
      await refetch()
    } catch (err) {
      setFlushError(err.message || 'Failed to flush buffer')
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
      <Box px={2} pt={2} pb={0}>
        <LoadingOverlay loading fullScreen />
      </Box>
    )
  }

  if (error && !diagnostics) {
    return (
      <Box px={2} pt={2} pb={0}>
        <Typography variant="h4" component="h1" gutterBottom>
          Diagnostics
        </Typography>
        <ErrorAlert error={error} sx={{ mt: 2, mb: 0 }} />
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

      <ErrorAlert error={error} severity="warning" sx={{ mt: 1, mb: 1 }} />

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* ROW 1: Tall cards - Sensor Health, Battery Levels, Database Statistics, Data Quality */}

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

        {/* Database Statistics Section */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Database Statistics
              </Typography>
              <Box display="flex" flexDirection="column" gap={1} mt={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Records:
                  </Typography>
                  <Typography variant="body1">
                    {diagnostics?.dbStats?.totalRecords != null
                      ? formatNumber(diagnostics.dbStats.totalRecords)
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Growth Rate:
                  </Typography>
                  <Typography variant="body1">
                    {diagnostics?.dbStats?.growthRatePerDay != null
                      ? `${formatBytes(diagnostics.dbStats.growthRatePerDay)}/day`
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Write:
                  </Typography>
                  <Typography variant="body1">
                    {diagnostics?.dbStats?.lastWriteTime
                      ? formatters.toLocalDateTime(
                          diagnostics.dbStats.lastWriteTime
                        )
                      : 'N/A'}
                  </Typography>
                </Box>
                {diagnostics?.dbStats?.recordsByMac?.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Records Per Sensor:
                    </Typography>
                    {diagnostics.dbStats.recordsByMac.map((item) => {
                      const sensorName =
                        configs.ruuviTags.find((tag) => tag.mac === item.mac)
                          ?.name || item.mac
                      return (
                        <Typography key={item.mac} variant="body2">
                          {sensorName}: {formatNumber(item.count)}
                        </Typography>
                      )
                    })}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Quality Section */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Data Quality
              </Typography>
              <Box display="flex" flexDirection="column" gap={1} mt={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Out-of-Range Readings:
                  </Typography>
                  <Typography
                    variant="body1"
                    color={
                      (diagnostics?.dataQuality?.outOfRangeCount ?? 0) > 0
                        ? 'warning.main'
                        : 'text.primary'
                    }
                  >
                    {diagnostics?.dataQuality?.outOfRangeCount ?? 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Today&apos;s Range:
                  </Typography>
                  {diagnostics?.dataQuality?.todayMinMax?.minTemperature !=
                    null &&
                  diagnostics?.dataQuality?.todayMinMax?.maxTemperature !=
                    null ? (
                    <>
                      <Typography variant="body2">
                        {diagnostics.dataQuality.todayMinMax.minTemperature.toFixed(
                          1
                        )}
                        °C &ndash;{' '}
                        {diagnostics.dataQuality.todayMinMax.maxTemperature.toFixed(
                          1
                        )}
                        °C
                      </Typography>
                      <Typography variant="body2">
                        {diagnostics.dataQuality.todayMinMax.minHumidity ?? 0}%
                        &ndash;{' '}
                        {diagnostics.dataQuality.todayMinMax.maxHumidity ?? 0}%
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body1">N/A</Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ROW 2: Short cards - System Info, System Resources, External APIs, Buffer Status */}

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

        {/* System Resources Section */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                System Resources
              </Typography>
              <Box display="flex" flexDirection="column" gap={1} mt={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Node.js:
                  </Typography>
                  <Typography variant="body1">
                    {diagnostics?.systemResources?.nodeVersion ?? 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Heap Memory:
                  </Typography>
                  <Typography variant="body1">
                    {diagnostics?.systemResources?.memory
                      ? `${formatBytes(diagnostics.systemResources.memory.heapUsed)} / ${formatBytes(diagnostics.systemResources.memory.heapTotal)}`
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Disk Space:
                  </Typography>
                  <Typography variant="body1">
                    {diagnostics?.systemResources?.disk?.free != null
                      ? `${formatBytes(diagnostics.systemResources.disk.free)} free`
                      : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* External APIs Section */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                External APIs
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.5}>
                {diagnostics?.externalApis ? (
                  <>
                    <ApiStatusIndicator
                      name="Energy Prices"
                      statusData={diagnostics.externalApis.energyPrices}
                    />
                    <ApiStatusIndicator
                      name="OpenWeatherMap"
                      statusData={diagnostics.externalApis.openWeatherMap}
                    />
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No external API data available
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Buffer Status Section - positioned on right to prevent accidental clicks */}
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
                <ErrorAlert
                  error={flushSuccess}
                  severity="success"
                  sx={{ mt: 1, mb: 0 }}
                />
                <ErrorAlert error={flushError} sx={{ mt: 1, mb: 0 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ROW 3: Flush History, Reading Frequency, Data Gaps */}

        {/* Flush History Section */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Flush History
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.5} mt={1}>
                {diagnostics?.flushHistory?.length > 0 ? (
                  diagnostics.flushHistory.map((entry) => (
                    <Box key={entry.timestamp}>
                      <Typography variant="body2" color="text.secondary">
                        {formatters.toLocalDateTime(entry.timestamp)}
                      </Typography>
                      <Typography variant="body2">
                        {entry.count} records ({entry.durationMs} ms)
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No flush history
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reading Frequency Section */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Reading Frequency
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.5} mt={1}>
                {diagnostics?.dataQuality?.readingFrequency?.length > 0 ? (
                  diagnostics.dataQuality.readingFrequency.map((entry) => {
                    const sensorName =
                      configs.ruuviTags.find((tag) => tag.mac === entry.mac)
                        ?.name || entry.mac
                    return (
                      <Box key={entry.mac}>
                        <Typography variant="body2">
                          {sensorName}: {Math.round(entry.readingsPerHour)}/h
                        </Typography>
                      </Box>
                    )
                  })
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No frequency data
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Gaps Section */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Data Gaps
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.5} mt={1}>
                {diagnostics?.dataQuality?.dataGaps &&
                Object.keys(diagnostics.dataQuality.dataGaps).length > 0 ? (
                  Object.entries(diagnostics.dataQuality.dataGaps).map(
                    ([mac, gaps]) => {
                      const sensorName =
                        configs.ruuviTags.find((tag) => tag.mac === mac)
                          ?.name || mac
                      const gapCount = gaps?.length ?? 0
                      return (
                        <Box key={mac}>
                          <Typography variant="body2">
                            {sensorName}:{' '}
                            {gapCount > 0
                              ? `${gapCount} gap${gapCount > 1 ? 's' : ''}`
                              : 'No gaps'}
                          </Typography>
                        </Box>
                      )
                    }
                  )
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No gap data
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Log Section - full width */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="h6" component="h2">
                  Error Log
                </Typography>
                {errorLog.length > 0 && (
                  <Button variant="outlined" size="small" onClick={clearErrors}>
                    Clear Errors
                  </Button>
                )}
              </Box>
              <Box display="flex" flexDirection="column" gap={1}>
                {errorLog.length > 0 ? (
                  [...errorLog].reverse().map((entry) => (
                    <Box
                      key={entry.id}
                      sx={{
                        p: 1,
                        bgcolor: 'error.light',
                        borderRadius: 1,
                        opacity: 0.9,
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        gap={1}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: 'error.contrastText' }}
                        >
                          {entry.message}
                        </Typography>
                        {entry.source && (
                          <Chip
                            label={entry.source}
                            size="small"
                            sx={{
                              bgcolor: 'error.dark',
                              color: 'error.contrastText',
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: 'error.contrastText', opacity: 0.8 }}
                      >
                        {formatters.toLocalDateTime(entry.timestamp)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No errors logged
                  </Typography>
                )}
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
