// Normalize MAC addresses to lowercase for consistent lookups
// (RuuviTag scanner returns lowercase MACs from the payload)
const normalizeMac = (mac) => mac?.trim().toLowerCase() || ''

const macIds = import.meta.env.VITE_RUUVITAG_MACS?.split(',').map(normalizeMac)
const macNames = import.meta.env.VITE_RUUVITAG_NAMES?.split(',')

const ruuviTags = macIds.map((mac, index) => ({
  mac,
  name: macNames[index],
}))

/** @type {Configs} */
const configs = {
  macIds,
  ruuviTags,
  mainIndoorMac: normalizeMac(import.meta.env.VITE_MAIN_INDOOR_RUUVITAG_MAC),
  mainOutdoorMac: normalizeMac(import.meta.env.VITE_MAIN_OUTDOOR_RUUVITAG_MAC),
  openweatherApiKey: import.meta.env.VITE_OPENWEATHERMAP_APIKEY,
}

export default configs
