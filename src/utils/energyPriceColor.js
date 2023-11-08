/**
 * @param {number} price
 * @param {EnergyPriceColorSet} colorSet
 * @returns {string}
 */
const getByPrice = (price, colorSet) => {
  if (price <= 5) {
    // Green
    return colorSet.color1.main
  }
  if (price > 5 && price <= 8) {
    // A lighter green transitioning to yellow
    return colorSet.color2.main
  }
  if (price > 8 && price <= 13) {
    // Yellow
    return colorSet.color3.main
  }
  if (price > 13 && price <= 20) {
    // A lighter yellow transitioning to red
    return colorSet.color4.main
  }
  if (price > 20 && price <= 25) {
    // Dark Red
    return colorSet.color5.main
  }
  // Dark Red solid
  return colorSet.color6.main
}

const energyPriceColor = {
  getByPrice,
}

export default energyPriceColor
