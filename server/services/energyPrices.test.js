const energyPricesFromApi = require('./energyPricesFromApi')
const storage = require('../storage')
const energyPricesService = require('./energyPrices')

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
      expect(getEnergyPricesFromApiSpy).toBeCalledTimes(1)
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
})
