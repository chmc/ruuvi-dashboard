import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import VerticalBarChart from './VerticalBarChart'

const EnergyPricesCard = ({ energyPrices }) => {
  //   const data = [
  //     { name: 'Category 1', value: 25, color: 'blue' },
  //     { name: 'Category 2', value: 50, color: 'green' },
  //     { name: 'Category 3', value: 30, color: 'red' },
  //     // Add more data points as needed
  //   ]

  if (!energyPrices) {
    return null
  }

  const sortedEnergyPrices = energyPrices
    .map((energyPrice) => ({
      price: energyPrice.price,
      hour: energyPrice.hour,
      energyPrice: energyPrice.date,
    }))
    .sort((a, b) => a.hour - b.hour)

  const dataset = sortedEnergyPrices.map((energyPrice) => energyPrice.price)
  const labels = sortedEnergyPrices.map((energyPrice) => energyPrice.hour)

  return (
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <VerticalBarChart
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
