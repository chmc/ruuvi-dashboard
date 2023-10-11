import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'
import RuuviCard from './components/RuuviCard'
import InOutCard from './components/InOutCard'
import configs from './configs'

const App = () => {
  const [data, setData] = useState(null);
  const [ruuviDatas, setRuuviDatas] = useState(null)
  console.log('configs: ', configs)

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
      setRuuviDatas(json)
      console.log('app data: ', json)
      console.log(configs.ruuviTags[0], json[configs.ruuviTags[0].mac])
    }

    const intervalId = setInterval(fetchRuuviData, 5000);

    return () => clearInterval(intervalId)
  }, []);

  return (
    <Box m={2}>
      <Grid container spacing={2}>
        {ruuviDatas && configs.ruuviTags.map((macItem) =>
          <RuuviCard key={macItem.mac} ruuvi={macItem} ruuviData={ruuviDatas[macItem.mac]} />
        )}
        <InOutCard ruuviDatas={ruuviDatas} />
        <Grid item xs={12}>
          <p><strong>{data?.express}</strong></p>
        </Grid>
      </Grid>
    </Box>
  );
}

export default App;
