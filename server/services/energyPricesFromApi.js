const { createLogger } = require('../utils/logger')

const log = createLogger('energyPricesApi')

const getEnergyPricesFromApi = async () => {
  try {
    const response = await fetch(`https://api.spot-hinta.fi/TodayAndDayForward`)
    log.debug('Energy prices API called')
    const textData = await response.text()
    return textData
  } catch (error) {
    log.error({ err: error }, 'getEnergyPricesFromApi failed')
    return undefined
  }
}

module.exports = {
  getEnergyPricesFromApi,
}
