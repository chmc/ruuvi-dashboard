import { useState } from 'react'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { getSunrise, getSunset } from 'sunrise-sunset-js'
import RuuviCard from '../components/RuuviCard'
import InOutCard from '../components/InOutCard'
import WeatherForecastCard from '../components/WeatherForecastCard'
import EnergyPricesCard from '../components/EnergyPricesCard'
import CurrentEnergyPriceCard from '../components/CurrentEnergyPriceCard'
import LoadingOverlay from '../components/LoadingOverlay'
import ErrorAlert from '../components/ErrorAlert'
import usePollingData from '../hooks/usePollingData'
import configs from '../configs'
import apiService from '../services/api'

/** @type {number} Polling interval for sensor data (10 seconds) */
const SENSOR_POLL_INTERVAL = 10000
/** @type {number} Polling interval for trends (5 minutes) */
const TRENDS_POLL_INTERVAL = 5 * 60 * 1000
/** @type {number} Polling interval for weather/energy (30 minutes) */
const SLOW_POLL_INTERVAL = 30 * 60 * 1000

/**
 * Transform trends array to object keyed by MAC address
 * @param {Array<{mac: string}>} trendsData - Array of trend data
 * @returns {Object.<string, Object>} Trends keyed by MAC
 */
const transformTrends = (trendsData) =>
  trendsData.reduce((acc, trend) => ({ ...acc, [trend.mac]: trend }), {})

const DashboardScreen = () => {
  const [error, setError] = useState(null)

  const sunrise = getSunrise(60.1703524, 24.9589753)
  const sunset = getSunset(60.1703524, 24.9589753)

  // Sensor data - polls every 10 seconds
  const { data: ruuviDatas, loading: ruuviLoading } = usePollingData(
    apiService.fetchRuuviData,
    {
      interval: SENSOR_POLL_INTERVAL,
      onError: (err) => {
        setError('Failed to load sensor data')
        // eslint-disable-next-line no-console
        console.error('fetchRuuviData ERROR: ', err)
      },
    }
  )

  // Min/Max temperatures - polls every 10 seconds
  const { data: todayMinMaxTemperature } = usePollingData(
    apiService.fetchMinMaxTemperatures,
    {
      interval: SENSOR_POLL_INTERVAL,
      onError: (err) => {
        setError('Failed to load temperature data')
        // eslint-disable-next-line no-console
        console.error('fetchMinMaxTemperatures ERROR: ', err)
      },
    }
  )

  // Trends - polls every 5 minutes
  const { data: trends } = usePollingData(
    () => apiService.fetchTrends(configs.macIds),
    {
      interval: TRENDS_POLL_INTERVAL,
      transform: transformTrends,
      onError: (err) => {
        setError('Failed to load trend data')
        // eslint-disable-next-line no-console
        console.error('fetchTrends ERROR: ', err)
      },
    }
  )

  // Weather forecast - polls every 30 minutes
  const { data: weatherForecast } = usePollingData(
    apiService.fetchWeatherData,
    {
      interval: SLOW_POLL_INTERVAL,
      onError: (err) => {
        setError('Failed to load weather data')
        // eslint-disable-next-line no-console
        console.error('fetchWeatherData ERROR: ', err)
      },
    }
  )

  // Energy prices - polls every 30 minutes
  const { data: energyPricesData } = usePollingData(
    apiService.fetchEnergyPrices,
    {
      interval: SLOW_POLL_INTERVAL,
      onError: (err) => {
        setError('Failed to load energy prices')
        // eslint-disable-next-line no-console
        console.error('fetchEnergyPrices ERROR: ', err)
      },
    }
  )

  const todayEnergyPrices = energyPricesData?.todayEnergyPrices ?? null
  const tomorrowEnergyPrices = energyPricesData?.tomorrowEnergyPrices ?? null

  // Consider initial loading complete when ruuvi data is loaded
  const initialLoading = ruuviLoading

  if (initialLoading) {
    return (
      <Box px={1.5} pt={1.5} pb={0}>
        <LoadingOverlay loading fullScreen />
      </Box>
    )
  }

  return (
    <Box px={1.5} pt={1.5} pb={0}>
      <ErrorAlert error={error} />
      <Grid container spacing={1.5}>
        <InOutCard
          ruuviDatas={ruuviDatas}
          todayMinMaxTemperature={todayMinMaxTemperature}
          sunrise={sunrise}
          sunset={sunset}
        />
        {ruuviDatas &&
          configs.ruuviTags.map((macItem) => (
            <RuuviCard
              key={macItem.mac}
              ruuvi={macItem}
              ruuviData={ruuviDatas[macItem.mac]}
              trend={trends?.[macItem.mac]}
            />
          ))}
        <CurrentEnergyPriceCard energyPrices={todayEnergyPrices} />
        <WeatherForecastCard weatherForecast={weatherForecast} />
        <EnergyPricesCard
          title="Sähkön hinta tänään c/kWh"
          noPricesText="Odotellaan tämän päivän sähkön hintoja..."
          energyPrices={todayEnergyPrices}
        />
        <EnergyPricesCard
          title="Huomenna c/kWh"
          noPricesText="Huomisen sähkön hinnat tulevat klo 14.00 jälkeen"
          energyPrices={tomorrowEnergyPrices}
        />
      </Grid>
    </Box>
  )
}

export default DashboardScreen
