/* eslint-disable jsx-a11y/alt-text */
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import formatters from '../utils/formatters'

const WeatherForecastCard = ({ dailyWeatherList }) => {
  if (!dailyWeatherList) {
    return null
  }

  return (
    <Grid item xs={8}>
      <Card>
        <CardContent>
          {dailyWeatherList.map((dailyWeather) => (
            <Box
              component="div"
              ml={2.7}
              mr={2.7}
              sx={{ display: 'inline-block' }}
              key={dailyWeather.weekDay}
            >
              <Box display="flex" justifyContent="center">
                {dailyWeather.weekDay}
              </Box>
              <div>
                <img src={dailyWeather.iconUrl} />
              </div>
              <Box display="flex" justifyContent="center">
                {formatters.toTemperatureUI(dailyWeather.temp)}c /{' '}
                {dailyWeather.wind}ms
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Grid>
  )
}

export default WeatherForecastCard
