import { useState } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import VerticalBarChart from './VerticalBarChart'

const EnergyPricesCard = ({ title, noPricesText, energyPrices }) => {
  const [resolution, setResolution] = useState('1h')
  const [timeRange, setTimeRange] = useState('incoming')

  const handleResolutionChange = (event, newResolution) => {
    if (newResolution !== null) {
      setResolution(newResolution)
    }
  }

  const handleTimeRangeChange = (event, newTimeRange) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange)
    }
  }

  if (!energyPrices) {
    return (
      <Grid size={12}>
        <Card display="flex">
          <Box
            height={149}
            display="flex"
            alignItems="center" // Use alignItems for vertical centering
            justifyContent="center"
          >
            <CardContent>
              <Typography sx={{ fontSize: '12px' }}>{noPricesText}</Typography>
            </CardContent>
          </Box>
        </Card>
      </Grid>
    )
  }

  const sortedEnergyPrices = energyPrices
    .map((energyPrice) => ({
      price: energyPrice.price,
      hour: energyPrice.hour,
      date: new Date(energyPrice.date),
    }))
    .sort((a, b) => a.date - b.date)

  /**
   * Aggregates 15-minute price data into hourly averages
   * @param {Array} prices - Array of energy price objects
   * @returns {Array} - Array of hourly averaged energy price objects
   */
  const aggregateToHourlyAverages = (prices) => {
    const hourlyData = {}

    // Group by date and hour to prevent mixing data from different days
    prices.forEach((price) => {
      const { hour: priceHour, date } = price
      // Create a unique key using both date (YYYY-MM-DD) and hour
      const dateKey = date.toISOString().split('T')[0]
      const key = `${dateKey}-${priceHour}`

      if (!hourlyData[key]) {
        hourlyData[key] = {
          prices: [],
          dates: [],
          hour: priceHour,
        }
      }
      hourlyData[key].prices.push(price.price)
      hourlyData[key].dates.push(price.date)
    })

    // Create averaged data points
    return Object.keys(hourlyData)
      .map((key) => {
        const hourData = hourlyData[key]
        const avgPrice =
          Math.round(
            (hourData.prices.reduce((sum, p) => sum + p, 0) /
              hourData.prices.length) *
              100
          ) / 100
        // Use the earliest time in the hour for the date
        const earliestDate = new Date(Math.min(...hourData.dates))

        return {
          price: avgPrice,
          hour: hourData.hour,
          date: earliestDate,
        }
      })
      .sort((a, b) => a.date - b.date)
  }

  /**
   * Filters prices based on the selected time range
   * @param {Array} prices - Array of energy price objects
   * @param {string} range - Time range filter ('all', 'incoming', '00-12', '06-18', '12-24')
   * @returns {Array} - Filtered array of energy price objects
   */
  const filterByTimeRange = (prices, range) => {
    if (range === 'all') {
      return prices
    }

    const now = new Date()

    if (range === 'incoming') {
      return prices.filter((price) => price.date >= now)
    }

    // Filter by hour ranges
    const hourRanges = {
      '00-12': [0, 12],
      '06-18': [6, 18],
      '12-24': [12, 24],
    }

    const [startHour, endHour] = hourRanges[range] || [0, 24]
    return prices.filter(
      (price) => price.hour >= startHour && price.hour < endHour
    )
  }

  // Aggregate to hourly averages if 1h resolution is selected
  let processedEnergyPrices =
    resolution === '1h'
      ? aggregateToHourlyAverages(sortedEnergyPrices)
      : sortedEnergyPrices

  // Apply time range filter for 15min resolution
  if (resolution === '15min') {
    processedEnergyPrices = filterByTimeRange(processedEnergyPrices, timeRange)
  }

  /**
   * Gets the color band for a price value
   * @param {number} price - Price value
   * @returns {number} - Color band index (0-5)
   */
  const getPriceColorBand = (price) => {
    if (price <= 5) return 0
    if (price <= 8) return 1
    if (price <= 13) return 2
    if (price <= 20) return 3
    if (price <= 25) return 4
    return 5
  }

  /**
   * Detects indices where price trend changes (for showing selective labels)
   * @param {Array} prices - Array of price values
   * @returns {Array} - Array of booleans indicating where to show labels
   */
  const detectTrendChanges = (prices) => {
    if (prices.length <= 2) {
      return prices.map(() => true)
    }

    const showLabel = new Array(prices.length).fill(false)

    // Always show first and last
    showLabel[0] = true
    showLabel[prices.length - 1] = true

    // Detect trend changes
    for (let i = 1; i < prices.length - 1; i++) {
      const prev = prices[i - 1]
      const curr = prices[i]
      const next = prices[i + 1]

      // Show label at local maxima or minima
      if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
        showLabel[i] = true
      }
      // Show label when trend changes direction
      else if (
        (prev < curr && curr > next) ||
        (prev > curr && curr < next) ||
        (prev === curr && curr !== next) ||
        (prev !== curr && curr === next)
      ) {
        showLabel[i] = true
      }
    }

    return showLabel
  }

  /**
   * Detects indices where color band changes
   * @param {Array} prices - Array of price values
   * @returns {Array} - Array of booleans indicating where color changes
   */
  const detectColorChanges = (prices) => {
    const showLabel = new Array(prices.length).fill(false)

    // Always show first
    showLabel[0] = true

    // Detect color band changes
    for (let i = 1; i < prices.length; i++) {
      const prevColorBand = getPriceColorBand(prices[i - 1])
      const currColorBand = getPriceColorBand(prices[i])

      if (prevColorBand !== currColorBand) {
        showLabel[i] = true
      }
    }

    return showLabel
  }

  const dataset = processedEnergyPrices.map((energyPrice) => energyPrice.price)

  // Combine trend changes and color changes for 15min resolution
  let showLabels = null
  if (resolution === '15min') {
    const trendLabels = detectTrendChanges(dataset)
    const colorLabels = detectColorChanges(dataset)

    // Merge both: show label if either condition is true
    showLabels = trendLabels.map((trend, i) => trend || colorLabels[i])
  }

  const labels = processedEnergyPrices.map((energyPrice) => {
    if (resolution === '1h') {
      return energyPrice.hour
    }
    // For 15min resolution, show hour:minute format
    const { date } = energyPrice
    const minutes = date.getMinutes()
    return `${energyPrice.hour}:${minutes.toString().padStart(2, '0')}`
  })

  return (
    <Grid size={12}>
      <Card>
        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
          <VerticalBarChart
            title={title}
            dataset={dataset}
            labels={labels}
            fullData={processedEnergyPrices}
            showLabels={showLabels}
            headerControls={
              <>
                <ToggleButtonGroup
                  value={resolution}
                  exclusive
                  onChange={handleResolutionChange}
                  size="small"
                  aria-label="price resolution"
                >
                  <ToggleButton value="1h" aria-label="1 hour resolution">
                    1h
                  </ToggleButton>
                  <ToggleButton value="15min" aria-label="15 minute resolution">
                    15min
                  </ToggleButton>
                </ToggleButtonGroup>
                {resolution === '15min' && (
                  <ToggleButtonGroup
                    value={timeRange}
                    exclusive
                    onChange={handleTimeRangeChange}
                    size="small"
                    aria-label="time range"
                    sx={{ ml: 0.5 }}
                  >
                    <ToggleButton value="incoming" aria-label="incoming prices">
                      Incoming
                    </ToggleButton>
                    <ToggleButton value="all" aria-label="all prices">
                      All
                    </ToggleButton>
                    <ToggleButton value="00-12" aria-label="00-12 hours">
                      00-12
                    </ToggleButton>
                    <ToggleButton value="06-18" aria-label="06-18 hours">
                      06-18
                    </ToggleButton>
                    <ToggleButton value="12-24" aria-label="12-24 hours">
                      12-24
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              </>
            }
          />
        </CardContent>
      </Card>
    </Grid>
  )
}

export default EnergyPricesCard
