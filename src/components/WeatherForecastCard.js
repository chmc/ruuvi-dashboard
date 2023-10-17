/* eslint-disable jsx-a11y/alt-text */
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import AirIcon from '@mui/icons-material/Air'
import Chip from '@mui/material/Chip'
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
              ml={2.75}
              mr={2.75}
              sx={{ display: 'inline-block' }}
              key={dailyWeather.weekDay}
            >
              <Box display="flex" justifyContent="center" mb={-2}>
                {dailyWeather.weekDay}
              </Box>
              <Box display="flex" justifyContent="center">
                <img src={dailyWeather.iconUrl} />
              </Box>
              <Box display="flex" justifyContent="center" mt={-1.5}>
                <Box mr={1}>
                  <Chip
                    size="small"
                    icon={<ThermostatIcon fontSize="small" color="primary" />}
                    label={formatters.toTemperatureRoundUpUI(dailyWeather.temp)}
                  />
                </Box>
                <Box>
                  <Chip
                    size="small"
                    icon={<AirIcon fontSize="small" color="primary" />}
                    label={formatters.toTemperatureRoundUpUI(dailyWeather.wind)}
                  />
                </Box>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Grid>
  )
}

export default WeatherForecastCard
