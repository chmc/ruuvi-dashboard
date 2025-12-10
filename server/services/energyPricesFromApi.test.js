const { getEnergyPricesFromApi } = require('./energyPricesFromApi')

describe('getEnergyPricesFromApi()', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.useRealTimers()
  })

  describe('timeout behavior', () => {
    it('should timeout after 10 seconds when API is unresponsive', async () => {
      // Arrange - mock fetch to never resolve but track if AbortSignal is passed
      let receivedSignal = null
      global.fetch = jest.fn((url, options) => {
        receivedSignal = options?.signal
        return new Promise((resolve, reject) => {
          // If signal is provided, listen for abort
          if (receivedSignal) {
            receivedSignal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'))
            })
          }
          // Otherwise never resolve (simulates unresponsive API)
        })
      })

      jest.useFakeTimers()

      // Act - start the request
      const promise = getEnergyPricesFromApi()

      // Advance timers past the 10 second timeout
      jest.advanceTimersByTime(10001)

      // Allow any pending promises to resolve
      await Promise.resolve()

      // Assert - verify AbortSignal was passed to fetch (required for timeout)
      expect(receivedSignal).toBeInstanceOf(AbortSignal)

      // Assert - should reject with timeout error
      await expect(promise).rejects.toThrow(/timeout|abort/i)
    })

    it('should pass AbortSignal to fetch for timeout control', async () => {
      // Arrange
      let capturedOptions = null
      global.fetch = jest.fn((url, options) => {
        capturedOptions = options
        return Promise.resolve({ text: () => Promise.resolve('[]') })
      })

      // Act
      await getEnergyPricesFromApi()

      // Assert - verify that fetch is called with signal option
      expect(capturedOptions).toBeDefined()
      expect(capturedOptions.signal).toBeInstanceOf(AbortSignal)
    })
  })

  describe('successful responses', () => {
    it('should return data when API responds within timeout', async () => {
      // Arrange
      const mockData = '[{"price": 1}]'
      global.fetch = jest.fn(() =>
        Promise.resolve({ text: () => Promise.resolve(mockData) })
      )

      // Act
      const result = await getEnergyPricesFromApi()

      // Assert
      expect(result).toBe(mockData)
    })
  })
})
