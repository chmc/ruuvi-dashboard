const { createLogger } = require('../utils/logger')

const log = createLogger('energyPricesApi')

/** @type {number} Timeout duration for API requests in milliseconds */
const FETCH_TIMEOUT_MS = 10000

/**
 * Fetches energy prices from the spot-hinta.fi API.
 *
 * Retrieves today's and tomorrow's electricity spot prices from Finland.
 * The request will timeout after 10 seconds if the API is unresponsive.
 *
 * @async
 * @returns {Promise<string>} Raw JSON string containing energy price data
 * @throws {Error} When the API request fails or times out
 * @throws {DOMException} When the request is aborted due to timeout (AbortError)
 *
 * @example
 * try {
 *   const pricesJson = await getEnergyPricesFromApi();
 *   const prices = JSON.parse(pricesJson);
 * } catch (error) {
 *   console.error('Failed to fetch energy prices:', error.message);
 * }
 */
const getEnergyPricesFromApi = async () => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(`https://api.spot-hinta.fi/TodayAndDayForward`, {
      signal: controller.signal,
    })
    log.debug('Energy prices API called')
    const textData = await response.text()
    return textData
  } catch (error) {
    log.error({ err: error }, 'getEnergyPricesFromApi failed')
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

module.exports = {
  getEnergyPricesFromApi,
}
