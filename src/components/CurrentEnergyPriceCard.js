import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

/**
 * @typedef   CurrentEnergyPrice
 * @type      {Object}
 * @property  {EnergyPrice[]} energyPrices
 */

/**
 * @param {CurrentEnergyPrice} props
 */
const CurrentEnergyPrice = ({ energyPrices }) => {
  if (!energyPrices) {
    return null
  }

  const today = new Date()
  const hourNow = today.getHours()
  const hourNext = today.getHours() + 1
  const currentPrice = energyPrices.find(
    (energyPrice) => energyPrice.hour === hourNow
  )
  const nextPrice = energyPrices.find(
    (energyPrice) => energyPrice.hour === hourNext
  )

  return (
    <Grid item xs={2}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center">
            <Typography variant="h4" component="div">
              {currentPrice.price}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="center">
            <Typography variant="p" component="div">
              c/kWh
            </Typography>
          </Box>
          <Box display="flex" justifyContent="center" mt={2.8}>
            <Typography variant="p" component="div">
              Next: {nextPrice.price} c/kWh
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  )
}

export default CurrentEnergyPrice
