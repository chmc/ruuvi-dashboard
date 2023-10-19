import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom'
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop'
import ThermostatIcon from '@mui/icons-material/Thermostat'
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
const InOutCard = ({ ruuviDatas, todayMinMaxTemperature }) => {
  if (!ruuviDatas) {
    return null
  }
  const indoorRuuvi = ruuviDatas[configs.mainIndoorMac]
  const outdoorRuuvi = ruuviDatas[configs.mainOutdoorMac]

  return (
    <Grid item xs={4}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Sisällä
              </Typography>
              <Typography variant="h5" color="text.secondary">
                <Box display="flex" alignItems="center">
                  {uiFormatter.toTemperatureUI(indoorRuuvi.temperature)}
                  <ThermostatIcon fontSize="small" color="primary" />
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Ulkona
              </Typography>
              <Typography variant="h5" color="text.secondary">
                <Box display="flex" alignItems="center">
                  {uiFormatter.toTemperatureUI(outdoorRuuvi.temperature)}
                  <ThermostatIcon fontSize="small" color="primary" />
                </Box>
                {todayMinMaxTemperature && (
                  <Box display="flex" mt={1.8}>
                    <Box
                      p={0.75}
                      pr={1.25}
                      display="flex"
                      bgcolor="rgba(255, 255, 255, 0.16)"
                      borderRadius={4}
                      fontSize="small"
                      alignItems="center"
                      mr={1}
                    >
                      <VerticalAlignBottomIcon
                        fontSize="small"
                        color="primary"
                      />
                      {uiFormatter.toTemperatureUI(
                        todayMinMaxTemperature.minTemperature
                      )}
                    </Box>
                    <Box
                      p={0.75}
                      pr={1.25}
                      display="flex"
                      bgcolor="rgba(255, 255, 255, 0.16)"
                      borderRadius={4}
                      fontSize="small"
                      alignItems="center" // Use alignItems for vertical centering
                    >
                      <VerticalAlignTopIcon fontSize="small" color="primary" />
                      {uiFormatter.toTemperatureUI(
                        todayMinMaxTemperature.maxTemperature
                      )}
                    </Box>
                  </Box>
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default InOutCard
