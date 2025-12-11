const energyPricesFromApi = require('./energyPricesFromApi')
const storage = require('../storage')
const energyPricesService = require('./energyPrices')
const externalApiStatus = require('./externalApiStatus')

describe('energyPricesService', () => {
  describe('getEnergyPrices()', () => {
    beforeAll(() => {
      jest.useFakeTimers()
      jest.resetModules()
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it('should return object with energy prices for today', async () => {
      // Arrange
      jest.setSystemTime(new Date('2023-10-27T12:11:00'))
      const apiResponseJson = `
      [{
        "Rank": 1,
        "DateTime": "2023-10-27T00:00:00+03:00",
        "PriceNoTax": 0.0342,
        "PriceWithTax": 0.0424
      },
      {
        "Rank": 8,
        "DateTime": "2023-10-27T01:00:00+03:00",
        "PriceNoTax": 0.0509,
        "PriceWithTax": 0.0631
      },
      {
        "Rank": 7,
        "DateTime": "2023-10-27T02:00:00+03:00",
        "PriceNoTax": 0.0497,
        "PriceWithTax": 0.0617
      },
      {
        "Rank": 4,
        "DateTime": "2023-10-27T03:00:00+03:00",
        "PriceNoTax": 0.0486,
        "PriceWithTax": 0.0603
      }]`
      jest.spyOn(storage, 'loadOrDefault').mockResolvedValue(undefined)
      jest.spyOn(storage, 'save').mockImplementation(jest.fn)
      const getEnergyPricesFromApiSpy = jest.spyOn(
        energyPricesFromApi,
        'getEnergyPricesFromApi'
      )
      getEnergyPricesFromApiSpy.mockResolvedValue(apiResponseJson)

      // Act
      const result = await energyPricesService.getEnergyPrices(undefined)

      // Assert
      expect(getEnergyPricesFromApiSpy).toHaveBeenCalledTimes(1)
      expect(result).toMatchSnapshot()
    })

    it('should return current energy prices and not get new', async () => {
      // Arrange
      jest.setSystemTime(new Date('2023-10-24T12:11:00'))

      /** @type {EnergyPrices} */
      const energyPrices = {
        updatedAt: new Date('2023-10-24T12:00:00'),
        todayEnergyPrices: {
          updatedAt: new Date('2023-10-24T12:00:00'),
          pricesForDate: '2023-10-24',
          data: [
            {
              date: new Date('2023-10-24T12:00:00'),
              price: 0.05,
              hour: 12,
            },
          ],
        },
      }
      jest.spyOn(storage, 'loadOrDefault').mockResolvedValue(undefined)
      jest.spyOn(storage, 'save').mockImplementation(jest.fn)

      // Act
      const result = await energyPricesService.getEnergyPrices(energyPrices)

      // Assert
      expect(result).toMatchSnapshot()
    })
  })

  describe('External API Status Integration', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    beforeEach(() => {
      externalApiStatus.reset()
    })

    it('should record success status when API call succeeds', async () => {
      // Arrange
      jest.setSystemTime(new Date('2023-10-27T12:11:00'))
      const apiResponseJson = `
      [{
        "Rank": 1,
        "DateTime": "2023-10-27T00:00:00+03:00",
        "PriceNoTax": 0.0342,
        "PriceWithTax": 0.0424
      }]`
      jest.spyOn(storage, 'loadOrDefault').mockResolvedValue(undefined)
      jest.spyOn(storage, 'save').mockImplementation(jest.fn)
      jest
        .spyOn(energyPricesFromApi, 'getEnergyPricesFromApi')
        .mockResolvedValue(apiResponseJson)

      // Act
      await energyPricesService.getEnergyPrices(undefined)

      // Assert
      const status = externalApiStatus.getStatus()
      expect(status.energyPrices.status).toBe('ok')
      expect(status.energyPrices.lastSuccess).not.toBeNull()
    })

    it('should record error status when API call fails', async () => {
      // Arrange
      jest.setSystemTime(new Date('2023-10-27T12:11:00'))
      jest.spyOn(storage, 'loadOrDefault').mockResolvedValue(undefined)
      jest
        .spyOn(energyPricesFromApi, 'getEnergyPricesFromApi')
        .mockResolvedValue(undefined)

      // Act
      await energyPricesService.getEnergyPrices(undefined)

      // Assert
      const status = externalApiStatus.getStatus()
      expect(status.energyPrices.status).toBe('error')
      expect(status.energyPrices.lastError).not.toBeNull()
      expect(status.energyPrices.errorMessage).toBeTruthy()
    })

    it('should record error status when JSON parsing fails', async () => {
      // Arrange
      jest.setSystemTime(new Date('2023-10-27T12:11:00'))
      jest.spyOn(storage, 'loadOrDefault').mockResolvedValue(undefined)
      jest
        .spyOn(energyPricesFromApi, 'getEnergyPricesFromApi')
        .mockResolvedValue('invalid json')

      // Act
      await energyPricesService.getEnergyPrices(undefined)

      // Assert
      const status = externalApiStatus.getStatus()
      expect(status.energyPrices.status).toBe('error')
      expect(status.energyPrices.errorMessage).toBeTruthy()
    })
  })

  describe('allowUpdateEnergyPrices edge cases', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    beforeEach(() => {
      jest.clearAllMocks()
      externalApiStatus.reset()
    })

    it('should fetch new prices when date changes (midnight rollover)', async () => {
      // Arrange
      // Current time: Dec 11 at 00:30 UTC (just after midnight)
      // Today prices stored with pricesForDate = Dec 10 (yesterday!)
      // Last update: Dec 10 at 23:30 UTC (1 hour ago - less than 4 hour threshold)
      // BUG: Without date check, update won't trigger because:
      //   - Objects exist (isEnergyPricesObjectOrtodayMissing = false)
      //   - Not after 12:00 (isCloseToTomorrowPrices = false)
      //   - Less than 4 hours since update (isCurrentPricesTooOld = false)
      // FIX: Should trigger update because pricesForDate doesn't match current date
      // NOTE: Using UTC times (Z suffix) to avoid timezone issues in tests
      jest.setSystemTime(new Date('2023-12-11T00:30:00Z'))

      const apiResponseJson = `
      [{
        "Rank": 1,
        "DateTime": "2023-12-11T00:00:00Z",
        "PriceNoTax": 0.0500,
        "PriceWithTax": 0.0620
      }]`

      /** @type {EnergyPrices} */
      const energyPrices = {
        updatedAt: new Date('2023-12-10T23:30:00Z'), // 1 hour ago
        todayEnergyPrices: {
          updatedAt: new Date('2023-12-10T23:30:00Z'),
          pricesForDate: '2023-12-10', // YESTERDAY! Should trigger update
          data: [
            {
              date: new Date('2023-12-10T12:00:00Z'),
              price: 0.05,
              hour: 12,
            },
          ],
        },
        tomorrowEnergyPrices: {
          updatedAt: new Date('2023-12-10T23:30:00Z'),
          pricesForDate: '2023-12-11', // This is now "today"
          data: [
            {
              date: new Date('2023-12-11T00:00:00Z'),
              price: 0.06,
              hour: 0,
            },
          ],
        },
      }

      jest.spyOn(storage, 'loadOrDefault').mockResolvedValue(undefined)
      jest.spyOn(storage, 'save').mockImplementation(jest.fn)
      const getEnergyPricesFromApiSpy = jest.spyOn(
        energyPricesFromApi,
        'getEnergyPricesFromApi'
      )
      getEnergyPricesFromApiSpy.mockResolvedValue(apiResponseJson)

      // Act
      await energyPricesService.getEnergyPrices(energyPrices)

      // Assert
      // The API should be called because stored pricesForDate (Dec 10)
      // doesn't match current date (Dec 11)
      expect(getEnergyPricesFromApiSpy).toHaveBeenCalledTimes(1)
    })

    it('should NOT fetch new prices when pricesForDate matches current date and within 4 hour threshold', async () => {
      // Arrange
      // Current time: Dec 11 at 10:30 UTC
      // Today prices stored with correct pricesForDate = Dec 11
      // Last update: Dec 11 at 08:00 UTC (2.5 hours ago - less than 4 hour threshold)
      // Should NOT trigger update - everything is fresh
      // NOTE: Using UTC times (Z suffix) to avoid timezone issues in tests
      jest.setSystemTime(new Date('2023-12-11T10:30:00Z'))

      /** @type {EnergyPrices} */
      const energyPrices = {
        updatedAt: new Date('2023-12-11T08:00:00Z'), // 2.5 hours ago
        todayEnergyPrices: {
          updatedAt: new Date('2023-12-11T08:00:00Z'),
          pricesForDate: '2023-12-11', // Correct date
          data: [
            {
              date: new Date('2023-12-11T10:00:00Z'),
              price: 0.05,
              hour: 10,
            },
          ],
        },
        tomorrowEnergyPrices: undefined,
      }

      jest.spyOn(storage, 'loadOrDefault').mockResolvedValue(undefined)
      jest.spyOn(storage, 'save').mockImplementation(jest.fn)
      const getEnergyPricesFromApiSpy = jest.spyOn(
        energyPricesFromApi,
        'getEnergyPricesFromApi'
      )
      getEnergyPricesFromApiSpy.mockResolvedValue('[]')

      // Act
      await energyPricesService.getEnergyPrices(energyPrices)

      // Assert
      // API should NOT be called - date matches and within threshold
      expect(getEnergyPricesFromApiSpy).not.toHaveBeenCalled()
    })

    it('should fetch new prices when exactly 30 minutes have passed after 12:00 and no tomorrow prices exist', async () => {
      // Arrange
      // Current time: 13:30 (after 12:00)
      // Last update: 13:00 (exactly 30 minutes = 0.5 hours ago)
      // This tests the edge case where hoursDifference === 0.5
      // With the bug (hoursDifference > 0.5), this would NOT trigger an update
      // With the fix (hoursDifference >= 0.5), this SHOULD trigger an update
      jest.setSystemTime(new Date('2023-10-27T13:30:00'))

      const apiResponseJson = `
      [{
        "Rank": 1,
        "DateTime": "2023-10-27T13:00:00+03:00",
        "PriceNoTax": 0.0500,
        "PriceWithTax": 0.0620
      }]`

      /** @type {EnergyPrices} */
      const energyPrices = {
        updatedAt: new Date('2023-10-27T13:00:00'), // Exactly 30 minutes ago
        todayEnergyPrices: {
          updatedAt: new Date('2023-10-27T13:00:00'),
          pricesForDate: '2023-10-27',
          data: [
            {
              date: new Date('2023-10-27T13:00:00'),
              price: 0.05,
              hour: 13,
            },
          ],
        },
        tomorrowEnergyPrices: undefined, // No tomorrow prices - should trigger update
      }

      jest.spyOn(storage, 'loadOrDefault').mockResolvedValue(undefined)
      jest.spyOn(storage, 'save').mockImplementation(jest.fn)
      const getEnergyPricesFromApiSpy = jest.spyOn(
        energyPricesFromApi,
        'getEnergyPricesFromApi'
      )
      getEnergyPricesFromApiSpy.mockResolvedValue(apiResponseJson)

      // Act
      await energyPricesService.getEnergyPrices(energyPrices)

      // Assert
      // The API should be called because:
      // 1. It's after 12:00 (13:30)
      // 2. At least 30 minutes have passed (exactly 0.5 hours)
      // 3. No tomorrow prices exist
      expect(getEnergyPricesFromApiSpy).toHaveBeenCalledTimes(1)
    })
  })
})
