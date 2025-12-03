import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import WeatherCard from './WeatherCard'

/**
 * @typedef   WeatherForecastCard
 * @type      {Object}
 * @property  {WeatherForecast} weatherForecast
 */

/**
 * @param {WeatherForecastCard} props
 */
const WeatherForecastCard = ({ weatherForecast }) => {
  if (!weatherForecast) {
    return null
  }

  return (
    <Grid item xs={10}>
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
          {weatherForecast.hourlyForecast.map((weather) => (
            <WeatherCard
              weather={weather}
              showTime="true"
              key={weather.weekDay + weather.time}
            />
          ))}
          {weatherForecast.dailyForecast.map((weather) => (
            <WeatherCard
              weather={weather}
              showTime="false"
              key={weather.weekDay}
            />
          ))}
        </CardContent>
      </Card>
    </Grid>
  )
}

export default WeatherForecastCard
