const macIds = process.env.REACT_APP_RUUVITAG_MACS?.split(',')
const macNames = process.env.REACT_APP_RUUVITAG_NAMES?.split(',')

const ruuviTags = macIds.map((mac, index) => ({
  mac,
  name: macNames[index],
}))

const configs = {
  ruuviTags,
  mainIndoorMac: process.env.REACT_APP_MAIN_INDOOR_RUUVITAG_MAC,
  mainOutdoorMac: process.env.REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC,
  openweatherApiKey: process.env.REACT_APP_OPENWEATHERMAP_APIKEY,
}

export default configs
