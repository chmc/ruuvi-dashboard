/* eslint-disable jsx-a11y/alt-text */
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import AirIcon from '@mui/icons-material/Air'
import Chip from '@mui/material/Chip'
import formatters from '../utils/formatters'

/**
 * @typedef   WeatherForecastCard
 * @type      {Object}
 * @property  {Weather[]} dailyWeatherList
 */

/**
 * @param {WeatherForecastCard} props
 */
const WeatherForecastCard = ({ dailyWeatherList }) => {
  if (!dailyWeatherList) {
    return null
  }

  return (
    <Grid item xs={6}>
      <Card>
        <CardContent>
          {dailyWeatherList.map((dailyWeather) => (
            <Box
              component="div"
              ml={0.8}
              mr={0.8}
              sx={{ display: 'inline-block' }}
              key={dailyWeather.weekDay}
            >
              <Box display="flex" justifyContent="center" mb={-2.4}>
                {dailyWeather.weekDay}
              </Box>
              <Box display="flex" justifyContent="center">
                <img src={dailyWeather.iconUrl} width={90} />
              </Box>
              <Box display="flex" justifyContent="center" mt={-1}>
                <Box mr={1}>
                  <Chip
                    size="small"
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    icon={<ThermostatIcon fontSize="small" color="primary" />}
                    label={formatters.toTemperatureRoundUpUI(dailyWeather.temp)}
                  />
                </Box>
                <Box>
                  <Chip
                    size="small"
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
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
