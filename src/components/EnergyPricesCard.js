import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import VerticalBarChart from './VerticalBarChart'

const EnergyPricesCard = ({ title, noPricesText, energyPrices }) => {
  if (!energyPrices) {
    return (
      <Grid item xs={12}>
        <Card display="flex">
          <Box
            height={149}
            display="flex"
            alignItems="center" // Use alignItems for vertical centering
            justifyContent="center"
          >
            <CardContent>
              <Typography variant="body1">{noPricesText}</Typography>
            </CardContent>
          </Box>
        </Card>
      </Grid>
    )
  }

  const sortedEnergyPrices = energyPrices
    .map((energyPrice) => ({
      price: energyPrice.price,
      hour: energyPrice.hour,
      date: new Date(energyPrice.date),
    }))
    .sort((a, b) => a.hour - b.hour)

  const dataset = sortedEnergyPrices.map((energyPrice) => energyPrice.price)
  const labels = sortedEnergyPrices.map((energyPrice) => energyPrice.hour)

  return (
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <VerticalBarChart
            title={title}
            dataset={dataset}
            labels={labels}
            fullData={sortedEnergyPrices}
          />
        </CardContent>
      </Card>
    </Grid>
  )
}

export default EnergyPricesCard
