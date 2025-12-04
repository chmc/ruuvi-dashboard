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
 * @typedef   HourlyWeatherForecastCard
 * @type      {Object}
 * @property  {Weather[]} weatherList
 */

/**
 * @param {HourlyWeatherForecastCard} props
 */
const HourlyWeatherForecastCard = ({ weatherList }) => {
  if (!weatherList) {
    return null
  }

  return (
    <Grid size={6}>
      <Card>
        <CardContent>
          {weatherList.map((weather) => (
            <Box
              component="div"
              ml={0.8}
              mr={0.8}
              sx={{ display: 'inline-block' }}
              key={weather.weekDay + weather.time}
            >
              <Box display="flex" justifyContent="center" mb={-2.4}>
                {weather.weekDay}: {weather.time}
              </Box>
              <Box display="flex" justifyContent="center">
                <img src={weather.iconUrl} width={90} />
              </Box>
              <Box display="flex" justifyContent="center" mt={-1}>
                <Box mr={1}>
                  <Chip
                    size="small"
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    icon={<ThermostatIcon fontSize="small" color="primary" />}
                    label={formatters.toTemperatureRoundUpUI(weather.temp)}
                  />
                </Box>
                <Box>
                  <Chip
                    size="small"
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    icon={<AirIcon fontSize="small" color="primary" />}
                    label={formatters.toTemperatureRoundUpUI(weather.wind)}
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

export default HourlyWeatherForecastCard
