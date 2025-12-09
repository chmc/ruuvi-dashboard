import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Thunderstorm from '@mui/icons-material/Thunderstorm'
import Grain from '@mui/icons-material/Grain'
import Cloud from '@mui/icons-material/Cloud'
import FilterDrama from '@mui/icons-material/FilterDrama'
import WbSunny from '@mui/icons-material/WbSunny'
import uiFormatter from '../utils/formatters'
import TrendIndicator from './TrendIndicator'

/**
 * Map iconName from formatter to MUI icon component
 * @type {Record<string, JSX.Element>}
 */
const WEATHER_ICONS = {
  thunderstorm: <Thunderstorm fontSize="small" color="primary" />,
  rain: <Grain fontSize="small" color="primary" />,
  cloud: <Cloud fontSize="small" color="primary" />,
  partlyCloudy: <FilterDrama fontSize="small" color="primary" />,
  sunny: <WbSunny fontSize="small" color="primary" />,
}

/**
 * @typedef {Object} TrendData
 * @property {string} direction - 'rising' | 'rising-slightly' | 'stable' | 'falling-slightly' | 'falling'
 * @property {number} delta - Change value
 */

/**
 * @typedef {Object} SensorTrend
 * @property {string} mac
 * @property {TrendData | null} temperature
 * @property {TrendData | null} humidity
 */

/**
 * @param {Object} props
 * @param {Object} props.ruuvi - Ruuvi sensor config
 * @param {string} props.ruuvi.mac - MAC address
 * @param {string} props.ruuvi.name - Display name
 * @param {Object} [props.ruuviData] - Current sensor data
 * @param {SensorTrend} [props.trend] - Trend data for this sensor
 */
const RuuviCard = ({ ruuvi, ruuviData, trend }) => {
  const weatherData = uiFormatter.getPressureWeatherData(ruuviData?.pressure)
  const weatherIcon = weatherData ? WEATHER_ICONS[weatherData.iconName] : null
  const weatherWord = weatherData ? weatherData.word : '-'

  return (
    <Grid size={2}>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" component="div" fontWeight="medium">
            {ruuvi.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            <Box display="flex" alignItems="center" gap={0.5}>
              Asteet: {uiFormatter.toTemperatureUI(ruuviData?.temperature)} c
              {trend?.temperature && (
                <TrendIndicator
                  direction={trend.temperature.direction}
                  delta={trend.temperature.delta}
                />
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              Kosteus: {uiFormatter.toHumidityUI(ruuviData?.humidity)} %
              {trend?.humidity && (
                <TrendIndicator
                  direction={trend.humidity.direction}
                  delta={trend.humidity.delta}
                  unit="%"
                />
              )}
            </Box>
          </Typography>
          <Box display="flex" alignItems="center" mt={0.5}>
            {weatherIcon}
            <Typography variant="body2" color="text.secondary" ml={0.5}>
              {weatherWord}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  )
}

export default RuuviCard
