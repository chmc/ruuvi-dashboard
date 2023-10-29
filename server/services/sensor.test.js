const sensorService = require('./sensor')

describe('sensorService', () => {
  describe('getSensorData()', () => {
    /** @type {string[]} */
    const macIds = ['mac1', 'mac2']

    it('should return original sensor data because cached is empty', () => {
      // Arrange
      const sensorDataCollection = {
        mac1: {
          humidity: 47.17,
          temperature: 20.74,
          pressure: 1012.17,
          mac: 'mac1',
        },
        mac2: {
          humidity: 47.27,
          temperature: 21.37,
          pressure: 1012.4,
          mac: 'mac2',
        },
      }

      // Act
      const act = sensorService.getSensorData(sensorDataCollection, {}, macIds)

      // Assert
      expect(act).toMatchSnapshot()
    })

    it('should return original sensor data because cached is undefined', () => {
      // Arrange
      const sensorDataCollection = {
        mac1: {
          humidity: 47.17,
          temperature: 20.74,
          pressure: 1012.17,
          mac: 'mac1',
        },
        mac2: {
          humidity: 47.27,
          temperature: 21.37,
          pressure: 1012.4,
          mac: 'mac2',
        },
      }

      // Act
      const act = sensorService.getSensorData(
        sensorDataCollection,
        undefined,
        macIds
      )

      // Assert
      expect(act).toMatchSnapshot()
    })

    it('should get data from cache when mac2 sensor data is missing', () => {
      // Arrange
      const sensorDataCollection = {
        mac1: {
          humidity: 47.17,
          temperature: 20.74,
          pressure: 1012.17,
          mac: 'mac1',
        },
        // mac2 is missing from real sensor data
      }

      const cachedSensorDataCollection = {
        mac1: {
          humidity: 47.17,
          temperature: 20.74,
          pressure: 1012.17,
          mac: 'mac1',
        },
        mac2: {
          humidity: 12.34,
          temperature: 56.78,
          pressure: 1234.5,
          mac: 'mac2',
        },
      }

      // Act
      const act = sensorService.getSensorData(
        sensorDataCollection,
        cachedSensorDataCollection,
        macIds
      )

      // Assert
      expect(act).toMatchSnapshot()
    })

    it('should get data from cache when all sensor data is missing', () => {
      // Arrange
      const cachedSensorDataCollection = {
        mac1: {
          humidity: 11,
          temperature: 22,
          pressure: 33,
          mac: 'mac1',
        },
        mac2: {
          humidity: 44,
          temperature: 55,
          pressure: 66,
          mac: 'mac2',
        },
      }

      // Act
      const act = sensorService.getSensorData(
        undefined,
        cachedSensorDataCollection,
        macIds
      )

      // Assert
      expect(act).toMatchSnapshot()
    })
  })
})
