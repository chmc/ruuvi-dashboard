const ruuviParser = require('./ruuviParser')

describe('RuuviParser', () => {
  describe('parseDataFormat5()', () => {
    it('should parse valid data format 5 payload', () => {
      // Example payload from RuuviTag documentation
      // Format 5, temp 24.3°C, humidity 53.49%, pressure 100044 Pa
      // Accel: X=0.004G, Y=-0.004G, Z=1.036G
      // Battery: 2977mV, TX: 4dBm, Movement: 66, Sequence: 205
      const manufacturerData = Buffer.from([
        0x99,
        0x04, // Manufacturer ID (little-endian)
        0x05, // Data format 5
        0x12,
        0xfc, // Temperature: 0x12FC = 4860 -> 24.30°C
        0x53,
        0x94, // Humidity: 0x5394 = 21396 -> 53.49%
        0xc3,
        0x7c, // Pressure: 0xC37C = 50044 -> 100044 Pa
        0x00,
        0x04, // Accel-X: 4 mG
        0xff,
        0xfc, // Accel-Y: -4 mG
        0x04,
        0x0c, // Accel-Z: 1036 mG
        0xa8,
        0x16, // Power: battery + tx
        0x42, // Movement: 66
        0x00,
        0xcd, // Sequence: 205
        0xcb,
        0xb8,
        0x33,
        0x4c,
        0x88,
        0x4f, // MAC address
      ])

      const result = ruuviParser.parse(manufacturerData)

      expect(result).toBeDefined()
      expect(result.dataFormat).toBe(5)
      expect(result.temperature).toBeCloseTo(24.3, 1)
      expect(result.humidity).toBeCloseTo(53.49, 1)
      expect(result.pressure).toBeCloseTo(100044, 0)
      expect(result.accelerationX).toBe(4)
      expect(result.accelerationY).toBe(-4)
      expect(result.accelerationZ).toBe(1036)
      expect(result.movementCounter).toBe(66)
      expect(result.measurementSequence).toBe(205)
    })

    it('should parse negative temperature correctly', () => {
      // Temperature: -10°C = -2000 in raw = 0xF830
      const manufacturerData = Buffer.from([
        0x99,
        0x04, // Manufacturer ID
        0x05, // Data format 5
        0xf8,
        0x30, // Temperature: -2000 -> -10.00°C
        0x40,
        0x00, // Humidity: 16384 -> 40.96%
        0x00,
        0x00, // Pressure: 0 -> 50000 Pa
        0x00,
        0x00, // Accel-X: 0
        0x00,
        0x00, // Accel-Y: 0
        0x00,
        0x00, // Accel-Z: 0
        0x00,
        0x00, // Power
        0x00, // Movement
        0x00,
        0x00, // Sequence
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00, // MAC
      ])

      const result = ruuviParser.parse(manufacturerData)

      expect(result.temperature).toBeCloseTo(-10.0, 1)
      expect(result.humidity).toBeCloseTo(40.96, 1)
      expect(result.pressure).toBe(50000)
    })

    it('should parse battery voltage and tx power', () => {
      // Battery: 2977mV = (1377 + 1600) = 0x561 in 11 bits
      // TX: 4dBm = (4 + 40) / 2 = 22 in 5 bits
      // Combined: 0x561 << 5 | 22 = 0xAC36
      const manufacturerData = Buffer.from([
        0x99,
        0x04, // Manufacturer ID
        0x05, // Data format 5
        0x00,
        0x00, // Temperature
        0x00,
        0x00, // Humidity
        0x00,
        0x00, // Pressure
        0x00,
        0x00, // Accel-X
        0x00,
        0x00, // Accel-Y
        0x00,
        0x00, // Accel-Z
        0xac,
        0x36, // Power: battery 2977mV, tx 4dBm
        0x00, // Movement
        0x00,
        0x00, // Sequence
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00, // MAC
      ])

      const result = ruuviParser.parse(manufacturerData)

      expect(result.batteryVoltage).toBeCloseTo(2977, 0)
      expect(result.txPower).toBe(4)
    })

    it('should extract MAC address', () => {
      const manufacturerData = Buffer.from([
        0x99,
        0x04, // Manufacturer ID
        0x05, // Data format 5
        0x00,
        0x00, // Temperature
        0x00,
        0x00, // Humidity
        0x00,
        0x00, // Pressure
        0x00,
        0x00, // Accel-X
        0x00,
        0x00, // Accel-Y
        0x00,
        0x00, // Accel-Z
        0x00,
        0x00, // Power
        0x00, // Movement
        0x00,
        0x00, // Sequence
        0xaa,
        0xbb,
        0xcc,
        0xdd,
        0xee,
        0xff, // MAC address
      ])

      const result = ruuviParser.parse(manufacturerData)

      expect(result.mac).toBe('aa:bb:cc:dd:ee:ff')
    })

    it('should return null for invalid data format', () => {
      const manufacturerData = Buffer.from([
        0x99,
        0x04, // Manufacturer ID
        0x03, // Data format 3 (not supported yet)
        0x00,
        0x00,
      ])

      const result = ruuviParser.parse(manufacturerData)

      expect(result).toBeNull()
    })

    it('should return null for non-Ruuvi manufacturer data', () => {
      const manufacturerData = Buffer.from([
        0x00,
        0x00, // Wrong Manufacturer ID
        0x05,
        0x00,
        0x00,
      ])

      const result = ruuviParser.parse(manufacturerData)

      expect(result).toBeNull()
    })

    it('should return null for insufficient data length', () => {
      const manufacturerData = Buffer.from([0x99, 0x04, 0x05])

      const result = ruuviParser.parse(manufacturerData)

      expect(result).toBeNull()
    })

    it('should return null for null/undefined input', () => {
      expect(ruuviParser.parse(null)).toBeNull()
      expect(ruuviParser.parse(undefined)).toBeNull()
    })
  })

  describe('toSensorData()', () => {
    it('should convert parsed data to SensorData format', () => {
      const parsedData = {
        dataFormat: 5,
        temperature: 24.3,
        humidity: 53.49,
        pressure: 100044,
        accelerationX: 4,
        accelerationY: -4,
        accelerationZ: 1036,
        batteryVoltage: 2977,
        txPower: 4,
        movementCounter: 66,
        measurementSequence: 205,
        mac: 'aa:bb:cc:dd:ee:ff',
      }

      const sensorData = ruuviParser.toSensorData(parsedData)

      expect(sensorData).toEqual({
        data_format: 5,
        humidity: 53.49,
        temperature: 24.3,
        pressure: 100044,
        mac: 'aa:bb:cc:dd:ee:ff',
      })
    })

    it('should return null for null input', () => {
      expect(ruuviParser.toSensorData(null)).toBeNull()
    })
  })

  describe('getDataFormat()', () => {
    it('should return 5 for data format 5', () => {
      const manufacturerData = Buffer.from([0x99, 0x04, 0x05, 0x00])

      expect(ruuviParser.getDataFormat(manufacturerData)).toBe(5)
    })

    it('should return 3 for data format 3', () => {
      const manufacturerData = Buffer.from([0x99, 0x04, 0x03, 0x00])

      expect(ruuviParser.getDataFormat(manufacturerData)).toBe(3)
    })

    it('should return null for invalid data', () => {
      expect(ruuviParser.getDataFormat(null)).toBeNull()
      expect(ruuviParser.getDataFormat(Buffer.from([]))).toBeNull()
      expect(ruuviParser.getDataFormat(Buffer.from([0x00, 0x00]))).toBeNull()
    })
  })
})
