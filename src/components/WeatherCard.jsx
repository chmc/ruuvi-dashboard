import Box from '@mui/material/Box'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import AirIcon from '@mui/icons-material/Air'
import Chip from '@mui/material/Chip'
import formatters from '../utils/formatters'

/**
 * @typedef   WeatherCard
 * @type      {Object}
 * @property  {Weather} weather
 * @property  {boolean} showTime
 */

/**
 * @param {WeatherCard} props
 */
const WeatherCard = ({ weather, showTime }) => {
  /**
   * @param {Weater} weather
   * @param {boolean} showTime
   */
  const renderWeekDayAndTime = (weather, showTime) => {
    if (showTime) {
      return `${weather.weekDay}: ${weather.time}`
    }
    return weather.weekDay
  }

  return (
    <Box
      component="div"
      sx={{
        display: 'inline-block',
        flex: '1 0',
      }}
      key={weather.weekDay + weather.time}
    >
      <Box display="flex" justifyContent="center" mb={-2.4}>
        {renderWeekDayAndTime(weather, showTime)}
      </Box>
      <Box display="flex" justifyContent="center">
        <img
          src={weather.iconUrl}
          width={90}
          alt={formatters.toTemperatureRoundUpUI(weather.temp)}
        />
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
  )
}

export default WeatherCard
