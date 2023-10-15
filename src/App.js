import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import RuuviCard from './components/RuuviCard'
import InOutCard from './components/InOutCard'
import configs from './configs'
import formatters from './utils/formatters'
import WeatherForecastCard from './components/WeatherForecastCard'
import EnergyPricesCard from './components/EnergyPricesCard'

const App = () => {
  const [ruuviDatas, setRuuviDatas] = useState(null)
  const [dailyWeatherList, setDailyWeatherList] = useState(null)
  const [energyPrices, setEnergyPrices] = useState(null)

  useEffect(() => {
    const fetchRuuviData = async () => {
      const response = await fetch('/api/ruuvi')
      const json = await response.json()
      setRuuviDatas(json)
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
      setEnergyPrices(json)
    }

    // eslint-disable-next-line no-console
    fetchWeatherData().catch(console.error)
    // eslint-disable-next-line no-console
    fetchRuuviData().catch(console.error)
    // eslint-disable-next-line no-console
    // fetchEnergyPrices().catch(console.error)

    const text =
      ' [{"aikaleima_suomi":"2023-10-14T06:00","aikaleima_utc":"2023-10-14T03:00","hinta":"-0.43700"},{"aikaleima_suomi":"2023-10-14T05:00","aikaleima_utc":"2023-10-14T02:00","hinta":"-0.39500"},{"aikaleima_suomi":"2023-10-14T04:00","aikaleima_utc":"2023-10-14T01:00","hinta":"-0.34300"},{"aikaleima_suomi":"2023-10-14T07:00","aikaleima_utc":"2023-10-14T04:00","hinta":"-0.30200"},{"aikaleima_suomi":"2023-10-14T00:00","aikaleima_utc":"2023-10-13T21:00","hinta":"-0.29800"},{"aikaleima_suomi":"2023-10-14T03:00","aikaleima_utc":"2023-10-14T00:00","hinta":"-0.27700"},{"aikaleima_suomi":"2023-10-14T14:00","aikaleima_utc":"2023-10-14T11:00","hinta":"-0.26200"},{"aikaleima_suomi":"2023-10-14T13:00","aikaleima_utc":"2023-10-14T10:00","hinta":"-0.26000"},{"aikaleima_suomi":"2023-10-14T08:00","aikaleima_utc":"2023-10-14T05:00","hinta":"-0.26000"},{"aikaleima_suomi":"2023-10-14T23:00","aikaleima_utc":"2023-10-14T20:00","hinta":"-0.22400"},{"aikaleima_suomi":"2023-10-14T12:00","aikaleima_utc":"2023-10-14T09:00","hinta":"-0.21900"},{"aikaleima_suomi":"2023-10-14T11:00","aikaleima_utc":"2023-10-14T08:00","hinta":"-0.21900"},{"aikaleima_suomi":"2023-10-14T15:00","aikaleima_utc":"2023-10-14T12:00","hinta":"-0.21100"},{"aikaleima_suomi":"2023-10-14T02:00","aikaleima_utc":"2023-10-13T23:00","hinta":"-0.20600"},{"aikaleima_suomi":"2023-10-14T10:00","aikaleima_utc":"2023-10-14T07:00","hinta":"-0.20300"},{"aikaleima_suomi":"2023-10-14T09:00","aikaleima_utc":"2023-10-14T06:00","hinta":"-0.20300"},{"aikaleima_suomi":"2023-10-14T22:00","aikaleima_utc":"2023-10-14T19:00","hinta":"-0.12700"},{"aikaleima_suomi":"2023-10-14T01:00","aikaleima_utc":"2023-10-13T22:00","hinta":"-0.12500"},{"aikaleima_suomi":"2023-10-14T16:00","aikaleima_utc":"2023-10-14T13:00","hinta":"-0.12500"},{"aikaleima_suomi":"2023-10-14T21:00","aikaleima_utc":"2023-10-14T18:00","hinta":"-0.10700"},{"aikaleima_suomi":"2023-10-14T17:00","aikaleima_utc":"2023-10-14T14:00","hinta":"-0.10200"},{"aikaleima_suomi":"2023-10-14T18:00","aikaleima_utc":"2023-10-14T15:00","hinta":"0.00000"},{"aikaleima_suomi":"2023-10-14T20:00","aikaleima_utc":"2023-10-14T17:00","hinta":"0.00000"},{"aikaleima_suomi":"2023-10-14T19:00","aikaleima_utc":"2023-10-14T16:00","hinta":"0.00100"}]'
    const json = JSON.parse(text)
    // console.log(json)
    setEnergyPrices(json)

    const intervalId = setInterval(fetchRuuviData, 10000)
    return () => clearInterval(intervalId)
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
        <InOutCard ruuviDatas={ruuviDatas} />
        <WeatherForecastCard dailyWeatherList={dailyWeatherList} />
        <EnergyPricesCard energyPrices={energyPrices} />
      </Grid>
    </Box>
  )
}

export default App
