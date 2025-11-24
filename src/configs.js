// Normalize MAC addresses to lowercase for consistent lookups
// (RuuviTag scanner returns lowercase MACs from the payload)
const normalizeMac = (mac) => mac?.toLowerCase() || ''

const macIds = process.env.REACT_APP_RUUVITAG_MACS?.split(',').map(normalizeMac)
const macNames = process.env.REACT_APP_RUUVITAG_NAMES?.split(',')

const ruuviTags = macIds.map((mac, index) => ({
  mac,
  name: macNames[index],
}))

/** @type {Configs} */
const configs = {
  macIds,
  ruuviTags,
  mainIndoorMac: normalizeMac(process.env.REACT_APP_MAIN_INDOOR_RUUVITAG_MAC),
  mainOutdoorMac: normalizeMac(process.env.REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC),
  openweatherApiKey: process.env.REACT_APP_OPENWEATHERMAP_APIKEY,
}

export default configs
