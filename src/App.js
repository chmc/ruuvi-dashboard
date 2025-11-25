import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { getSunrise, getSunset } from 'sunrise-sunset-js'
import RuuviCard from './components/RuuviCard'
import InOutCard from './components/InOutCard'
import WeatherForecastCard from './components/WeatherForecastCard'
import EnergyPricesCard from './components/EnergyPricesCard'
import CurrentEnergyPriceCard from './components/CurrentEnergyPriceCard'
import configs from './configs'
import apiService from './services/api'
import { useSensorStream } from './hooks/useSensorStream'
import { useMultiPolling } from './hooks/usePolling'
import { useMinMaxTemperature } from './hooks/useMinMaxTemperature'
import { createLogger } from './utils/logger'

const log = createLogger('app:main')

/**
 * @typedef {WeatherForecast | null} weatherForecast
 * @typedef {function(WeatherForecast): void} setWeatherForecast
 * @typedef {EnergyPrice[] | null} todayEnergyPrices
 * @typedef {function(energyPrice[]): void} setTodayEnergyPrices
 */

const App = () => {
  const [ruuviDatas, setRuuviDatas] = useState(null)
  const sunrise = getSunrise(60.1703524, 24.9589753)
  const sunset = getSunset(60.1703524, 24.9589753)

  // Use SSE for real-time sensor data
  const {
    data: sensorStreamData,
    isConnected: isSensorConnected,
    error: sensorError,
  } = useSensorStream('/api/sensor-stream')

  // Use modern polling hooks for energy prices and weather (30-minute intervals)
  const { data: externalData, errors: externalErrors } = useMultiPolling(
    {
      weather: async () => apiService.fetchWeatherData(),
      energyPrices: async () => apiService.fetchEnergyPrices(),
    },
    {
      interval: 30 * 60 * 1000, // 30 minutes
      fetchOnMount: true,
    }
  )

  // Use specialized hook for min/max temperature (10-second intervals)
  const { data: todayMinMaxTemperature, error: minMaxError } =
    useMinMaxTemperature({
      interval: 10000, // 10 seconds
    })

  // Extract data from multi-polling results
  const weatherForecast = externalData?.weather || null
  const todayEnergyPrices =
    externalData?.energyPrices?.todayEnergyPrices || null
  const tomorrowEnergyPrices =
    externalData?.energyPrices?.tomorrowEnergyPrices || null

  // Update ruuviDatas when SSE stream data changes
  useEffect(() => {
    if (sensorStreamData) {
      setRuuviDatas(sensorStreamData)
    }
  }, [sensorStreamData])

  // Log only critical errors (SSE connection errors are already logged in the hook)
  useEffect(() => {
    if (externalErrors?.weather) {
      log.error('Weather polling error:', externalErrors.weather)
    }
    if (externalErrors?.energyPrices) {
      log.error('Energy prices polling error:', externalErrors.energyPrices)
    }
  }, [externalErrors])

  useEffect(() => {
    if (minMaxError) {
      log.error('Min/max temperature error:', minMaxError)
    }
  }, [minMaxError])

  return (
    <Box m={2}>
      <Grid container spacing={2}>
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

export default App
