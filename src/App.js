import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'

const App = () => {
  const [data, setData] = useState(null);
  const [ruuviData, setRuuviData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/express_backend')
      const json = await response.json()
      setData(json)
    }

    fetchData()
      .catch(console.error)

    const fetchRuuviData = async () => {
      console.log('call api')
      const response = await fetch('/api/ruuvi')
      const json = await response.json()
      setRuuviData(json)
      console.log('app data: ', json)
      console.log(macs[0], json[macs[0]])
    }

    const intervalId = setInterval(fetchRuuviData, 5000);

    return () => clearInterval(intervalId)
  }, []);

  const macs = process.env.REACT_APP_RUUVITAG_MACS.split(',')

  const showRuuviData = (mac) => {
    if (ruuviData) {
      return (
        <Grid item xs={4} key={mac}>
          <Card>
            <CardContent>
              <Typography variant='h5' component='div'>
                {mac}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Temp: {Math.round(ruuviData[mac].temperature * 100) / 100}c<br/>
                Humidity: {Math.round(ruuviData[mac].humidity)}%<br/>
                Pressure: {Math.round(ruuviData[mac].pressure)}p
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )
    }
  }

  return (
    <Box m={2}>
      <Grid container spacing={2}>
        {macs.map((mac) => showRuuviData(mac))}
        <Grid item>
          <p><strong>{data?.express}</strong></p>
        </Grid>
      </Grid>
    </Box>
  );
}

export default App;
