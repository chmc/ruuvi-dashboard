import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import configs from '../configs'
import uiFormatter from '../utils/formatters'

const InOutCard = ({ ruuviDatas }) => {
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
                {uiFormatter.toTemperatureUI(indoorRuuvi.temperature)}c
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
                {uiFormatter.toTemperatureUI(outdoorRuuvi.temperature)}c
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default InOutCard
