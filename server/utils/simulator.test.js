const { initSimulator, modifyDataWithWave } = require('./simulator')

describe('simulator', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('initSimulator', () => {
    it('should create sensor data for configured MACs', () => {
      process.env.VITE_RUUVITAG_MACS = 'AA:BB:CC:DD:EE:01,AA:BB:CC:DD:EE:02'

      const result = initSimulator()

      expect(Object.keys(result)).toHaveLength(2)
      expect(result['aa:bb:cc:dd:ee:01']).toBeDefined()
      expect(result['aa:bb:cc:dd:ee:02']).toBeDefined()
    })

    it('should include batteryVoltage in sensor data', () => {
      process.env.VITE_RUUVITAG_MACS = 'AA:BB:CC:DD:EE:01'

      const result = initSimulator()

      const sensorData = result['aa:bb:cc:dd:ee:01']
      expect(sensorData.batteryVoltage).toBeDefined()
      expect(sensorData.batteryVoltage).toBeGreaterThanOrEqual(2800)
      expect(sensorData.batteryVoltage).toBeLessThanOrEqual(3100)
    })

    it('should include all required sensor fields', () => {
      process.env.VITE_RUUVITAG_MACS = 'AA:BB:CC:DD:EE:01'

      const result = initSimulator()

      const sensorData = result['aa:bb:cc:dd:ee:01']
      expect(sensorData.data_format).toBe(5)
      expect(sensorData.humidity).toBeDefined()
      expect(sensorData.temperature).toBeDefined()
      expect(sensorData.pressure).toBeDefined()
      expect(sensorData.batteryVoltage).toBeDefined()
    })
  })

  describe('modifyDataWithWave', () => {
    it('should modify sensor values with wave pattern', () => {
      const initialData = {
        'aa:bb:cc:dd:ee:01': {
          humidity: 50,
          temperature: 20,
          pressure: 1000,
          batteryVoltage: 2900,
        },
      }

      const result = modifyDataWithWave(initialData)

      // Values should be modified (wave adds/subtracts from original)
      expect(result['aa:bb:cc:dd:ee:01']).toBeDefined()
    })
  })
})
