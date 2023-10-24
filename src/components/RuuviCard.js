import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import uiFormatter from '../utils/formatters'

const RuuviCard = ({ ruuvi, ruuviData }) => (
  <Grid item xs={3}>
    <Card>
      <CardContent>
        <Typography variant="h5" component="div">
          {ruuvi.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Asteet: {uiFormatter.toTemperatureUI(ruuviData?.temperature)} c<br />
          Kosteus: {uiFormatter.toHumidityUI(ruuviData?.humidity)} %<br />
          Ilmanpaine: {uiFormatter.toPressureUI(ruuviData?.pressure)} hPa
        </Typography>
      </CardContent>
    </Card>
  </Grid>
)

export default RuuviCard
