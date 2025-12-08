/**
 * @jest-environment node
 */

const externalApiStatus = require('./externalApiStatus')

describe('External API Status Service', () => {
  beforeEach(() => {
    // Reset the status before each test
    externalApiStatus.reset()
  })

  describe('getStatus', () => {
    it('should return status for all tracked APIs', () => {
      const status = externalApiStatus.getStatus()

      expect(status).toHaveProperty('energyPrices')
      expect(status).toHaveProperty('openWeatherMap')
    })

    it('should return unknown status when no fetches have occurred', () => {
      const status = externalApiStatus.getStatus()

      expect(status.energyPrices.status).toBe('unknown')
      expect(status.energyPrices.lastSuccess).toBeNull()
      expect(status.energyPrices.lastError).toBeNull()
      expect(status.energyPrices.errorMessage).toBeNull()

      expect(status.openWeatherMap.status).toBe('unknown')
      expect(status.openWeatherMap.lastSuccess).toBeNull()
      expect(status.openWeatherMap.lastError).toBeNull()
      expect(status.openWeatherMap.errorMessage).toBeNull()
    })
  })

  describe('recordSuccess', () => {
    it('should record successful energy prices API fetch', () => {
      const beforeTime = Date.now()
      externalApiStatus.recordSuccess('energyPrices')
      const afterTime = Date.now()

      const status = externalApiStatus.getStatus()

      expect(status.energyPrices.status).toBe('ok')
      expect(status.energyPrices.lastSuccess).toBeGreaterThanOrEqual(beforeTime)
      expect(status.energyPrices.lastSuccess).toBeLessThanOrEqual(afterTime)
      expect(status.energyPrices.errorMessage).toBeNull()
    })

    it('should record successful OpenWeatherMap API fetch', () => {
      const beforeTime = Date.now()
      externalApiStatus.recordSuccess('openWeatherMap')
      const afterTime = Date.now()

      const status = externalApiStatus.getStatus()

      expect(status.openWeatherMap.status).toBe('ok')
      expect(status.openWeatherMap.lastSuccess).toBeGreaterThanOrEqual(
        beforeTime
      )
      expect(status.openWeatherMap.lastSuccess).toBeLessThanOrEqual(afterTime)
      expect(status.openWeatherMap.errorMessage).toBeNull()
    })

    it('should clear previous error when success is recorded', () => {
      // First record an error
      externalApiStatus.recordError('energyPrices', 'Network timeout')

      // Then record a success
      externalApiStatus.recordSuccess('energyPrices')

      const status = externalApiStatus.getStatus()

      expect(status.energyPrices.status).toBe('ok')
      expect(status.energyPrices.errorMessage).toBeNull()
      // lastError should still be set (for history)
      expect(status.energyPrices.lastError).not.toBeNull()
    })
  })

  describe('recordError', () => {
    it('should record energy prices API error', () => {
      const beforeTime = Date.now()
      externalApiStatus.recordError('energyPrices', 'Network timeout')
      const afterTime = Date.now()

      const status = externalApiStatus.getStatus()

      expect(status.energyPrices.status).toBe('error')
      expect(status.energyPrices.lastError).toBeGreaterThanOrEqual(beforeTime)
      expect(status.energyPrices.lastError).toBeLessThanOrEqual(afterTime)
      expect(status.energyPrices.errorMessage).toBe('Network timeout')
    })

    it('should record OpenWeatherMap API error', () => {
      const beforeTime = Date.now()
      externalApiStatus.recordError('openWeatherMap', 'Invalid API key')
      const afterTime = Date.now()

      const status = externalApiStatus.getStatus()

      expect(status.openWeatherMap.status).toBe('error')
      expect(status.openWeatherMap.lastError).toBeGreaterThanOrEqual(beforeTime)
      expect(status.openWeatherMap.lastError).toBeLessThanOrEqual(afterTime)
      expect(status.openWeatherMap.errorMessage).toBe('Invalid API key')
    })

    it('should preserve lastSuccess when error is recorded', () => {
      // First record a success
      externalApiStatus.recordSuccess('energyPrices')
      const successStatus = externalApiStatus.getStatus()
      const lastSuccessTime = successStatus.energyPrices.lastSuccess

      // Then record an error
      externalApiStatus.recordError('energyPrices', 'API down')

      const status = externalApiStatus.getStatus()

      expect(status.energyPrices.status).toBe('error')
      expect(status.energyPrices.lastSuccess).toBe(lastSuccessTime)
    })
  })

  describe('reset', () => {
    it('should reset all status to initial state', () => {
      // Record some activity
      externalApiStatus.recordSuccess('energyPrices')
      externalApiStatus.recordError('openWeatherMap', 'Error')

      // Reset
      externalApiStatus.reset()

      const status = externalApiStatus.getStatus()

      expect(status.energyPrices.status).toBe('unknown')
      expect(status.energyPrices.lastSuccess).toBeNull()
      expect(status.energyPrices.lastError).toBeNull()
      expect(status.energyPrices.errorMessage).toBeNull()

      expect(status.openWeatherMap.status).toBe('unknown')
      expect(status.openWeatherMap.lastSuccess).toBeNull()
      expect(status.openWeatherMap.lastError).toBeNull()
      expect(status.openWeatherMap.errorMessage).toBeNull()
    })
  })

  describe('invalid API names', () => {
    it('should throw error for invalid API name on recordSuccess', () => {
      expect(() => {
        externalApiStatus.recordSuccess('invalidApi')
      }).toThrow('Unknown API: invalidApi')
    })

    it('should throw error for invalid API name on recordError', () => {
      expect(() => {
        externalApiStatus.recordError('invalidApi', 'Error')
      }).toThrow('Unknown API: invalidApi')
    })
  })
})
