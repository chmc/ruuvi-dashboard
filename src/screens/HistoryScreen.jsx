import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import configs from '../configs'

/**
 * Available time range options for history data
 * @type {Array<{value: string, label: string}>}
 */
const TIME_RANGES = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'all', label: 'All' },
]

/**
 * History screen - displays historical sensor data with charts
 * @returns {JSX.Element}
 */
const HistoryScreen = () => {
  const [selectedRange, setSelectedRange] = useState('24h')

  /**
   * Handle time range selection change
   * @param {React.MouseEvent<HTMLElement>} _event - Click event
   * @param {string|null} newRange - Newly selected range
   */
  const handleRangeChange = (_event, newRange) => {
    if (newRange !== null) {
      setSelectedRange(newRange)
    }
  }

  return (
    <Box px={2} pt={2} pb={0}>
      <Typography variant="h4" component="h1" gutterBottom>
        History
      </Typography>

      {/* Time Range Selector */}
      <Box mb={2}>
        <ToggleButtonGroup
          value={selectedRange}
          exclusive
          onChange={handleRangeChange}
          aria-label="time range selection"
          size="small"
        >
          {TIME_RANGES.map((range) => (
            <ToggleButton key={range.value} value={range.value}>
              {range.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Sensor List */}
      <Box>
        <List>
          {configs.ruuviTags.map((sensor) => (
            <ListItem key={sensor.mac} data-testid="sensor-item">
              <ListItemText primary={sensor.name} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  )
}

export default HistoryScreen
