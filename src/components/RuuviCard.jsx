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

/**
 * Get pressure weather icon and word
 * @param {number=} pressure
 * @returns {{ icon: JSX.Element, word: string }}
 */
const getPressureWeather = (pressure) => {
  if (!pressure) return { icon: null, word: '-' }
  if (pressure < 990) {
    return {
      icon: <Thunderstorm fontSize="small" color="primary" />,
      word: 'Myrsky',
    }
  }
  if (pressure < 1005) {
    return {
      icon: <Grain fontSize="small" color="primary" />,
      word: 'Sade',
    }
  }
  if (pressure < 1015) {
    return {
      icon: <Cloud fontSize="small" color="primary" />,
      word: 'Pilvi',
    }
  }
  if (pressure < 1025) {
    return {
      icon: <FilterDrama fontSize="small" color="primary" />,
      word: 'Pouta',
    }
  }
  return {
    icon: <WbSunny fontSize="small" color="primary" />,
    word: 'Aurinko',
  }
}

const RuuviCard = ({ ruuvi, ruuviData }) => {
  const weather = getPressureWeather(ruuviData?.pressure)

  return (
    <Grid size={2}>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" component="div" fontWeight="medium">
            {ruuvi.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Asteet: {uiFormatter.toTemperatureUI(ruuviData?.temperature)} c
            <br />
            Kosteus: {uiFormatter.toHumidityUI(ruuviData?.humidity)} %
          </Typography>
          <Box display="flex" alignItems="center" mt={0.5}>
            {weather.icon}
            <Typography variant="body2" color="text.secondary" ml={0.5}>
              {weather.word}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  )
}

export default RuuviCard
