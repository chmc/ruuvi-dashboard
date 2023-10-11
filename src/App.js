import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box'
import RuuviCard from './components/RuuviCard'
import configs from './configs'

const App = () => {
  const [data, setData] = useState(null);
  const [ruuviData, setRuuviData] = useState(null)
  console.log('macs: ', configs.macs)
  const daa = configs.macs.map((mac) => mac.name)
  console.log('names: ', daa)

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
      console.log(configs.macs[0], json[configs.macs[0].mac])
    }

    const intervalId = setInterval(fetchRuuviData, 5000);

    return () => clearInterval(intervalId)
  }, []);

  const showRuuviData = (mac) => {
    console.log('show ruuvi', mac)
    if (ruuviData) {
      return (
        <Grid item xs={4} key={mac}>
          <RuuviCard mac={mac} ruuviData={ruuviData[mac]} />
        </Grid>
      )
    }
  }

  return (
    <Box m={2}>
      <Grid container spacing={2}>
        {configs.macs.map((macItem) => showRuuviData(macItem.mac))}
        <Grid item>
          <p><strong>{data?.express}</strong></p>
        </Grid>
      </Grid>
    </Box>
  );
}

export default App;
