import { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

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
        <div key={mac}>
          <strong>{mac}</strong>
          <div>Temp: {Math.round(ruuviData[mac].temperature * 100) / 100}c</div>
          <div>Humidity: {Math.round(ruuviData[mac].humidity)}%</div>
          <div>Pressure: {Math.round(ruuviData[mac].pressure)}p</div>
        </div>
        )
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <div>Macs: {process.env.REACT_APP_RUUVITAG_MACS}</div>
        {macs.map((mac) => showRuuviData(mac))}
        <p><strong>{data?.express}</strong></p>
      </header>
    </div>
  );
}

export default App;
