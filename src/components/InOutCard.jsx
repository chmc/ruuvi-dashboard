import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom'
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import WbSunny from '@mui/icons-material/WbSunny'
import WbTwilight from '@mui/icons-material/WbTwilight'
import Box from '@mui/material/Box'
import configs from '../configs'
import uiFormatter from '../utils/formatters'

/**
 * @typedef   InOutCard
 * @type      {Object}
 * @property  {SensorDataCollection}    ruuviDatas
 * @property  {TodayMinMaxTemperature}  todayMinMaxTemperature
 */

/**
 * @param {InOutCard} props
 */
const InOutCard = ({ ruuviDatas, todayMinMaxTemperature, sunrise, sunset }) => {
  if (!ruuviDatas) {
    return null
  }
  const indoorRuuvi = ruuviDatas[configs.mainIndoorMac]
  const outdoorRuuvi = ruuviDatas[configs.mainOutdoorMac]

  return (
    <Grid size={4}>
      <Grid container spacing={1.5}>
        <Grid size={6}>
          <Card>
            <CardContent>
              <Typography
                variant="subtitle1"
                component="div"
                fontWeight="medium"
              >
                Sisällä
              </Typography>
              <Typography variant="h5" color="text.secondary">
                <Box display="flex" alignItems="center">
                  {uiFormatter.toTemperatureUI(indoorRuuvi?.temperature)}
                  <ThermostatIcon fontSize="small" color="primary" />
                </Box>
              </Typography>
              <Box display="flex" mt={0.5}>
                <Box display="flex" alignItems="center">
                  <WbSunny fontSize="small" color="primary" />
                  <Typography variant="body1" color="text.secondary" ml={1}>
                    {uiFormatter.toShortTimeUI(sunrise)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    ml={1}
                    mr={1}
                  >
                    {uiFormatter.toShortTimeUI(sunset)}
                  </Typography>
                  <WbTwilight fontSize="small" color="primary" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={6}>
          <Card>
            <CardContent>
              <Typography
                variant="subtitle1"
                component="div"
                fontWeight="medium"
              >
                Ulkona
              </Typography>
              <Typography variant="h5" color="text.secondary">
                <Box display="flex" alignItems="center">
                  {uiFormatter.toTemperatureUI(outdoorRuuvi?.temperature)}
                  <ThermostatIcon fontSize="small" color="primary" />
                </Box>
              </Typography>
              {todayMinMaxTemperature && (
                <Box display="flex" mt={0.5} mb={-1}>
                  <Box
                    p={0.75}
                    pr={1.25}
                    display="flex"
                    bgcolor="rgba(255, 255, 255, 0.05)"
                    borderRadius={4}
                    fontSize="small"
                    alignItems="center"
                    mr={1}
                  >
                    <VerticalAlignBottomIcon fontSize="small" color="primary" />
                    {uiFormatter.toTemperatureUI(
                      todayMinMaxTemperature?.minTemperature
                    )}
                  </Box>
                  <Box
                    p={0.75}
                    pr={1.25}
                    display="flex"
                    bgcolor="rgba(255, 255, 255, 0.05)"
                    borderRadius={4}
                    fontSize="small"
                    alignItems="center" // Use alignItems for vertical centering
                  >
                    <VerticalAlignTopIcon fontSize="small" color="primary" />
                    {uiFormatter.toTemperatureUI(
                      todayMinMaxTemperature?.maxTemperature
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default InOutCard
