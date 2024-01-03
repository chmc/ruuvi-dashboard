/* eslint-disable no-use-before-define */
import { useEffect, useState, useCallback } from 'react'
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

/**
 * @typedef {WeatherForecast | null} weatherForecast
 * @typedef {function(WeatherForecast): void} setWeatherForecast
 * @typedef {EnergyPrice[] | null} todayEnergyPrices
 * @typedef {function(energyPrice[]): void} setTodayEnergyPrices
 */

const App = () => {
  const [ruuviDatas, setRuuviDatas] = useState(null)

  /** @type {[weatherForecast, setWeatherForecast]} */
  const [weatherForecast, setWeatherForecast] = useState(null)
  /** @type {[todayEnergyPrices, setTodayEnergyPrices]} */
  const [todayEnergyPrices, setTodayEnergyPrices] = useState(null)
  const [tomorrowEnergyPrices, setTomorrowEnergyPrices] = useState(null)
  const [todayMinMaxTemperature, setTodayMinMaxTemperature] = useState(null)
  const sunrise = getSunrise(60.1703524, 24.9589753)
  const sunset = getSunset(60.1703524, 24.9589753)

  const fetchEnergyPrices = useCallback(async () => {
    try {
      const json = await apiService.fetchEnergyPrices()
      setTodayEnergyPrices(json.todayEnergyPrices)
      setTomorrowEnergyPrices(json.tomorrowEnergyPrices)
    } catch (error) {
      console.log('fetchEnergyPrices ERROR: ', error)
    }
  }, [])

  const fetchMinMaxTemperatures = async () => {
    try {
      setTodayMinMaxTemperature(await apiService.fetchMinMaxTemperatures())
    } catch (error) {
      console.log('fetchMinMaxTemperatures ERROR: ', error)
    }
  }

  const fetchDataForEvery10sec = useCallback(async () => {
    try {
      await Promise.all([fetchRuuviData(), fetchMinMaxTemperatures()])
    } catch (error) {
      console.error('Error fetching data: ', error)
    }
  }, [])

  const fetchRuuviData = async () => {
    try {
      setRuuviDatas(await apiService.fetchRuuviData())
    } catch (error) {
      console.log('fetchRuuviData ERROR: ', error)
    }
  }

  const fetchWeatherData = useCallback(async () => {
    try {
      const weatherForecast = await apiService.fetchWeatherData()
      setWeatherForecast(weatherForecast)
    } catch (error) {
      console.log('fetchWeatherData ERROR: ', error)
    }
  }, [])

  const setupIntervals = useCallback(() => {
    const every10secIntervalId = setInterval(fetchDataForEvery10sec, 10000)

    const energyPricesIntervalId = setInterval(() => {
      fetchEnergyPrices()
    }, 30 * 60 * 1000)

    const weatherIntervalId = setInterval(() => {
      fetchWeatherData()
    }, 60 * 60 * 1000)

    return [every10secIntervalId, energyPricesIntervalId, weatherIntervalId]
  }, [fetchDataForEvery10sec, fetchEnergyPrices, fetchWeatherData])

  useEffect(() => {
    // eslint-disable-next-line no-console
    fetchDataForEvery10sec().catch(console.error)
    // eslint-disable-next-line no-console
    fetchEnergyPrices().catch(console.error)

    const [every10secIntervalId, energyPricesIntervalId, weatherIntervalId] =
      setupIntervals()

    return () => {
      clearInterval(every10secIntervalId)
      clearInterval(energyPricesIntervalId)
      clearInterval(weatherIntervalId)
    }
  }, [fetchDataForEvery10sec, fetchEnergyPrices, setupIntervals])

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
