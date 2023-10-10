import { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

const App = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/express_backend')
      const json = await response.json()
      setData(json)
    }

    fetchData()
      .catch(console.error)
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p><strong>{data?.express}</strong></p>
      </header>
    </div>
  );
}

export default App;
