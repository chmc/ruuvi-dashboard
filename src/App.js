import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { getSunrise, getSunset } from 'sunrise-sunset-js'
import RuuviCard from './components/RuuviCard'
import InOutCard from './components/InOutCard'
import WeatherForecastCard from './components/WeatherForecastCard'
import EnergyPricesCard from './components/EnergyPricesCard'
import configs from './configs'
import apiService from './services/api'

const App = () => {
  const [ruuviDatas, setRuuviDatas] = useState(null)
  const [dailyWeatherList, setDailyWeatherList] = useState(null)
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
        console.log('fetchRuuviData ERROR: ', error)
      }
    }

    const fetchWeatherData = async () => {
      try {
        setDailyWeatherList(await apiService.fetchWeatherData())
      } catch (error) {
        console.log('fetchWeatherData ERROR: ', error)
      }
    }

    const fetchEnergyPrices = async () => {
      try {
        const json = await apiService.fetchEnergyPrices()
        setTodayEnergyPrices(json.todayEnergyPrices)
        setTomorrowEnergyPrices(json.tomorrowEnergyPrices)
      } catch (error) {
        console.log('fetchEnergyPrices ERROR: ', error)
      }
    }

    const fetchMinMaxTemperatures = async () => {
      try {
        setTodayMinMaxTemperature(await apiService.fetchMinMaxTemperatures)
      } catch (error) {
        console.log('fetMinMaxTemperatures ERROR: ', error)
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

    const ruuviIntervalId = setInterval(() => {
      // Every 10sec
      fetchRuuviData()
      fetchMinMaxTemperatures()
    }, 10000)
    const energyPricesIntervalId = setInterval(() => {
      fetchEnergyPrices()
      // Every 30mins
    }, 30 * 60 * 1000)

    return () => {
      clearInterval(ruuviIntervalId)
      clearInterval(energyPricesIntervalId)
    }
  }, [])

  return (
    <Box m={2}>
      <Grid container spacing={2}>
        {ruuviDatas &&
          configs.ruuviTags.map((macItem) => (
            <RuuviCard
              key={macItem.mac}
              ruuvi={macItem}
              ruuviData={ruuviDatas[macItem.mac]}
            />
          ))}
        <InOutCard
          ruuviDatas={ruuviDatas}
          todayMinMaxTemperature={todayMinMaxTemperature}
          sunrise={sunrise}
          sunset={sunset}
        />
        <WeatherForecastCard dailyWeatherList={dailyWeatherList} />
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
