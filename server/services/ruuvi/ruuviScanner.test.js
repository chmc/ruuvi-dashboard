const ruuviScanner = require('./ruuviScanner')
const bleScanner = require('../ble/bleScanner')
const ruuviParser = require('./ruuviParser')

// Mock dependencies
jest.mock('../ble/bleScanner')
jest.mock('./ruuviParser')

describe('RuuviScanner', () => {
  let mockBleScanner
  let scanner
  let discoverHandler

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock BLE scanner
    mockBleScanner = {
      start: jest.fn(),
      stop: jest.fn(),
      on: jest.fn((event, handler) => {
        if (event === 'discover') {
          discoverHandler = handler
        }
      }),
      off: jest.fn(),
      setMacFilter: jest.fn(),
      getMacFilter: jest.fn(() => []),
      isScanning: jest.fn(() => false),
    }

    bleScanner.createScanner.mockReturnValue(mockBleScanner)
  })

  afterEach(() => {
    if (scanner) {
      scanner.stop()
    }
  })

  describe('createScanner()', () => {
    it('should create a scanner instance', () => {
      scanner = ruuviScanner.createScanner()

      expect(scanner).toBeDefined()
      expect(typeof scanner.start).toBe('function')
      expect(typeof scanner.stop).toBe('function')
      expect(typeof scanner.on).toBe('function')
      expect(typeof scanner.getSensorData).toBe('function')
    })

    it('should accept MAC addresses in options', () => {
      const macs = ['AA:BB:CC:DD:EE:FF', '11:22:33:44:55:66']
      scanner = ruuviScanner.createScanner({ macs })

      expect(mockBleScanner.setMacFilter).toHaveBeenCalledWith(macs)
    })
  })

  describe('start()', () => {
    it('should start the BLE scanner', () => {
      scanner = ruuviScanner.createScanner()
      scanner.start()

      expect(mockBleScanner.start).toHaveBeenCalled()
    })

    it('should register discover event handler', () => {
      scanner = ruuviScanner.createScanner()
      scanner.start()

      expect(mockBleScanner.on).toHaveBeenCalledWith(
        'discover',
        expect.any(Function)
      )
    })
  })

  describe('stop()', () => {
    it('should stop the BLE scanner', () => {
      scanner = ruuviScanner.createScanner()
      scanner.start()
      scanner.stop()

      expect(mockBleScanner.stop).toHaveBeenCalled()
    })
  })

  describe('data handling', () => {
    const mockPeripheral = {
      id: 'aabbccddeeff',
      address: 'AA:BB:CC:DD:EE:FF',
      advertisement: {
        manufacturerData: Buffer.from([0x99, 0x04, 0x05]),
      },
    }

    const mockParsedData = {
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

    const mockSensorData = {
      data_format: 5,
      humidity: 53.49,
      temperature: 24.3,
      pressure: 100044,
      mac: 'aa:bb:cc:dd:ee:ff',
    }

    beforeEach(() => {
      ruuviParser.parse.mockReturnValue(mockParsedData)
      ruuviParser.toSensorData.mockReturnValue(mockSensorData)
    })

    it('should emit data event when valid Ruuvi data is received', () => {
      const dataCallback = jest.fn()
      scanner = ruuviScanner.createScanner()
      scanner.on('data', dataCallback)
      scanner.start()

      // Trigger discover event
      discoverHandler(mockPeripheral)

      expect(ruuviParser.parse).toHaveBeenCalledWith(
        mockPeripheral.advertisement.manufacturerData
      )
      expect(ruuviParser.toSensorData).toHaveBeenCalledWith(mockParsedData)
      expect(dataCallback).toHaveBeenCalledWith({
        mac: 'aa:bb:cc:dd:ee:ff',
        sensorData: mockSensorData,
        rawData: mockParsedData,
        peripheral: mockPeripheral,
      })
    })

    it('should not emit data event when parse returns null', () => {
      ruuviParser.parse.mockReturnValue(null)

      const dataCallback = jest.fn()
      scanner = ruuviScanner.createScanner()
      scanner.on('data', dataCallback)
      scanner.start()

      discoverHandler(mockPeripheral)

      expect(dataCallback).not.toHaveBeenCalled()
    })

    it('should update internal sensor data collection', () => {
      scanner = ruuviScanner.createScanner()
      scanner.start()

      discoverHandler(mockPeripheral)

      const sensorDataCollection = scanner.getSensorData()
      expect(sensorDataCollection['aa:bb:cc:dd:ee:ff']).toEqual(mockSensorData)
    })

    it('should emit collection event with all sensor data', () => {
      const collectionCallback = jest.fn()
      scanner = ruuviScanner.createScanner()
      scanner.on('collection', collectionCallback)
      scanner.start()

      discoverHandler(mockPeripheral)

      expect(collectionCallback).toHaveBeenCalledWith({
        'aa:bb:cc:dd:ee:ff': mockSensorData,
      })
    })

    it('should handle multiple sensors', () => {
      const mockPeripheral2 = {
        id: '112233445566',
        address: '11:22:33:44:55:66',
        advertisement: {
          manufacturerData: Buffer.from([0x99, 0x04, 0x05]),
        },
      }

      const mockSensorData2 = {
        data_format: 5,
        humidity: 60.0,
        temperature: 20.0,
        pressure: 101000,
        mac: '11:22:33:44:55:66',
      }

      scanner = ruuviScanner.createScanner()
      scanner.start()

      // First sensor
      ruuviParser.parse.mockReturnValue(mockParsedData)
      ruuviParser.toSensorData.mockReturnValue(mockSensorData)
      discoverHandler(mockPeripheral)

      // Second sensor
      const mockParsedData2 = { ...mockParsedData, mac: '11:22:33:44:55:66' }
      ruuviParser.parse.mockReturnValue(mockParsedData2)
      ruuviParser.toSensorData.mockReturnValue(mockSensorData2)
      discoverHandler(mockPeripheral2)

      const sensorDataCollection = scanner.getSensorData()
      expect(Object.keys(sensorDataCollection)).toHaveLength(2)
      expect(sensorDataCollection['aa:bb:cc:dd:ee:ff']).toEqual(mockSensorData)
      expect(sensorDataCollection['11:22:33:44:55:66']).toEqual(mockSensorData2)
    })
  })

  describe('error handling', () => {
    it('should emit error event when parsing throws', () => {
      ruuviParser.parse.mockImplementation(() => {
        throw new Error('Parse error')
      })

      const errorCallback = jest.fn()
      scanner = ruuviScanner.createScanner()
      scanner.on('error', errorCallback)
      scanner.start()

      const mockPeripheral = {
        id: 'aabbccddeeff',
        advertisement: {
          manufacturerData: Buffer.from([0x99, 0x04, 0x05]),
        },
      }

      discoverHandler(mockPeripheral)

      expect(errorCallback).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})
