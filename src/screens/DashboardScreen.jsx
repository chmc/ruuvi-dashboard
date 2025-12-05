import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { getSunrise, getSunset } from 'sunrise-sunset-js'
import RuuviCard from '../components/RuuviCard'
import InOutCard from '../components/InOutCard'
import WeatherForecastCard from '../components/WeatherForecastCard'
import EnergyPricesCard from '../components/EnergyPricesCard'
import CurrentEnergyPriceCard from '../components/CurrentEnergyPriceCard'
import configs from '../configs'
import apiService from '../services/api'

/**
 * @typedef {WeatherForecast | null} weatherForecast
 * @typedef {function(WeatherForecast): void} setWeatherForecast
 * @typedef {EnergyPrice[] | null} todayEnergyPrices
 * @typedef {function(energyPrice[]): void} setTodayEnergyPrices
 */

const DashboardScreen = () => {
  const [ruuviDatas, setRuuviDatas] = useState(null)
  const [trends, setTrends] = useState(null)

  /** @type {[weatherForecast, setWeatherForecast]} */
  const [weatherForecast, setWeatherForecast] = useState(null)
  /** @type {[todayEnergyPrices, setTodayEnergyPrices]} */
  const [todayEnergyPrices, setTodayEnergyPrices] = useState(null)
  const [tomorrowEnergyPrices, setTomorrowEnergyPrices] = useState(null)
  const [todayMinMaxTemperature, setTodayMinMaxTemperature] = useState(null)
  const sunrise = getSunrise(60.1703524, 24.9589753)
  const sunset = getSunset(60.1703524, 24.9589753)

  useEffect(() => {
    const fetchRuuviData = async () => {
      try {
        setRuuviDatas(await apiService.fetchRuuviData())
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('fetchRuuviData ERROR: ', error)
      }
    }

    const fetchWeatherData = async () => {
      try {
        const weatherForecast = await apiService.fetchWeatherData()
        setWeatherForecast(weatherForecast)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('fetchWeatherData ERROR: ', error)
      }
    }

    const fetchEnergyPrices = async () => {
      try {
        const json = await apiService.fetchEnergyPrices()
        setTodayEnergyPrices(json.todayEnergyPrices)
        setTomorrowEnergyPrices(json.tomorrowEnergyPrices)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('fetchEnergyPrices ERROR: ', error)
      }
    }

    const fetchMinMaxTemperatures = async () => {
      try {
        setTodayMinMaxTemperature(await apiService.fetchMinMaxTemperatures())
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('fetchMinMaxTemperatures ERROR: ', error)
      }
    }

    const fetchTrends = async () => {
      try {
        const trendsData = await apiService.fetchTrends(configs.macIds)
        // Convert array to object keyed by MAC for easier lookup
        const trendsMap = trendsData.reduce(
          (acc, trend) => ({ ...acc, [trend.mac]: trend }),
          {}
        )
        setTrends(trendsMap)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('fetchTrends ERROR: ', error)
      }
    }

    // eslint-disable-next-line no-console
    fetchWeatherData().catch(console.error)
    // eslint-disable-next-line no-console
    fetchRuuviData().catch(console.error)
    // eslint-disable-next-line no-console
    fetchEnergyPrices().catch(console.error)
    // eslint-disable-next-line no-console
    fetchMinMaxTemperatures().catch(console.error)
    // eslint-disable-next-line no-console
    fetchTrends().catch(console.error)

    const ruuviIntervalId = setInterval(() => {
      // Every 10sec
      fetchRuuviData()
      fetchMinMaxTemperatures()
    }, 10000)
    const trendsIntervalId = setInterval(
      () => {
        // Every 5 minutes (trends don't change as frequently)
        fetchTrends()
      },
      5 * 60 * 1000
    )
    const energyPricesIntervalId = setInterval(
      () => {
        // Every 30mins
        fetchEnergyPrices()
        fetchWeatherData()
      },
      30 * 60 * 1000
    )

    return () => {
      clearInterval(ruuviIntervalId)
      clearInterval(energyPricesIntervalId)
      clearInterval(trendsIntervalId)
    }
  }, [])

  return (
    <Box px={2} pt={2} pb={0}>
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
