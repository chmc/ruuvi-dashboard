const temperatureService = require('./temperature')

describe('temperatureService', () => {
  describe('getTodayMinMaxTemperature()', () => {
    // Set the environment variable before running your tests
    beforeAll(() => {
      // Set the environment variable before importing your module
      process.env.VITE_MAIN_OUTDOOR_RUUVITAG_MAC = 'mac1'
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2023-10-24T12:11:00'))

      // Reset Jest modules to ensure your module sees the updated environment variable
      jest.resetModules()
    })

    // Restore the original environment variable after the tests
    afterAll(() => {
      // Clear the environment variable after the tests
      delete process.env.VITE_MAIN_OUTDOOR_RUUVITAG_MAC
      jest.useRealTimers()
    })

    it('should return object with min and max temp set to given temp', () => {
      const sensorDataCollection = {
        mac1: {
          data_format: 5,
          humidity: 47.17,
          temperature: 20.74,
          pressure: 1012.17,
          mac: 'mac1',
        },
        mac2: {
          data_format: 5,
          humidity: 47.27,
          temperature: 21.37,
          pressure: 1012.4,
          mac: 'mac2',
        },
      }

      const expected = {
        date: new Date('2023-10-24T12:11:00'),
        maxTemperature: 20.74,
        minTemperature: 20.74,
      }

      const act = temperatureService.getTodayMinMaxTemperature(
        sensorDataCollection,
        undefined
      )

      expect(act).toStrictEqual(expected)
    })

    it('should set max temp with given temp', () => {
      const sensorDataCollection = {
        mac1: {
          data_format: 5,
          humidity: 47.17,
          temperature: 20.74,
          pressure: 1012.17,
          mac: 'mac1',
        },
        mac2: {
          data_format: 5,
          humidity: 47.27,
          temperature: 21.37,
          pressure: 1012.4,
          mac: 'mac2',
        },
      }

      const todayMinMaxTemperature = {
        date: new Date('2023-10-24T12:11:00'),
        maxTemperature: 18,
        minTemperature: 15.24,
      }

      const expected = {
        date: new Date('2023-10-24T12:11:00'),
        maxTemperature: 20.74,
        minTemperature: 15.24,
      }

      const act = temperatureService.getTodayMinMaxTemperature(
        sensorDataCollection,
        todayMinMaxTemperature
      )

      expect(act).toStrictEqual(expected)
    })

    it('should set min temp with given temp', () => {
      const sensorDataCollection = {
        mac1: {
          data_format: 5,
          humidity: 47.17,
          temperature: 10,
          pressure: 1012.17,
          mac: 'mac1',
        },
        mac2: {
          data_format: 5,
          humidity: 47.27,
          temperature: 21.37,
          pressure: 1012.4,
          mac: 'mac2',
        },
      }

      const todayMinMaxTemperature = {
        date: new Date('2023-10-24T12:11:00'),
        maxTemperature: 18,
        minTemperature: 15.24,
      }

      const expected = {
        date: new Date('2023-10-24T12:11:00'),
        maxTemperature: 18,
        minTemperature: 10,
      }

      const act = temperatureService.getTodayMinMaxTemperature(
        sensorDataCollection,
        todayMinMaxTemperature
      )

      expect(act).toStrictEqual(expected)
    })
  })
})
