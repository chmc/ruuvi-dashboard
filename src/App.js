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

const App = () => {
  const [ruuviDatas, setRuuviDatas] = useState(null)
  const [dailyWeatherList, setDailyWeatherList] = useState(null)

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
          weekDay: formatters.toDayOfWeek(daily.dt_txt),
          temp: daily.main.temp,
          wind: daily.wind.speed,
          iconUrl: `https://openweathermap.org/img/wn/${daily.weather[0].icon}@2x.png`,
        }))
      setDailyWeatherList(weather)
    }

    // eslint-disable-next-line no-console
    fetchWeatherData().catch(console.error)
    // eslint-disable-next-line no-console
    fetchRuuviData().catch(console.error)

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
      </Grid>
    </Box>
  )
}

export default App
