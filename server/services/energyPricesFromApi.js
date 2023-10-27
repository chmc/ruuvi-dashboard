const getEnergyPricesFromApi = async () => {
  try {
    const response = await fetch(`https://api.spot-hinta.fi/TodayAndDayForward`)
    console.log('api called')
    const textData = await response.text()
    return textData
  } catch (error) {
    console.error('getEnergyPricesFromApi: ', error)
    return undefined
  }
}

module.exports = {
  getEnergyPricesFromApi,
}
