import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { getSunrise, getSunset } from 'sunrise-sunset-js'
import RuuviCard from './components/RuuviCard'
import InOutCard from './components/InOutCard'
import configs from './configs'
import formatters from './utils/formatters'
import WeatherForecastCard from './components/WeatherForecastCard'
import EnergyPricesCard from './components/EnergyPricesCard'

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
        const response = await fetch('/api/ruuvi')
        const json = await response.json()
        setRuuviDatas(json)
      } catch (error) {
        console.error(error)
      }
    }

    const fetchWeatherData = async () => {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=60.1695&lon=24.9355&units=metric&appid=${configs.openweatherApiKey}`
      )
      const json = await response.json()
      const weather = json.list
        .filter((item) => item.dt_txt.includes('12:00:00'))
        .map((daily) => ({
          date: daily.dt_txt,
          weekDay: formatters.toDayOfWeekUI(daily.dt_txt),
          temp: daily.main.temp,
          wind: daily.wind.speed,
          iconUrl: `https://openweathermap.org/img/wn/${daily.weather[0].icon}@2x.png`,
        }))
      setDailyWeatherList(weather)
    }

    const fetchEnergyPrices = async () => {
      const response = await fetch('/api/energyprices')
      const text = await response.text()
      const json = JSON.parse(text)
      console.log('energy: ', json)
      setTodayEnergyPrices(json.todayEnergyPrices)
      setTomorrowEnergyPrices(json.tomorrowEnergyPrices)
    }

    const fetchMinMaxTemperatures = async () => {
      const response = await fetch('/api/todayminmaxtemperature')
      const text = await response.text()
      const json = JSON.parse(text)
      console.log('minmax: ', json)
      setTodayMinMaxTemperature(json)
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
