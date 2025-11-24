// Mock noble before importing bleScanner (which requires it)
jest.mock('@abandonware/noble', () => ({
  on: jest.fn(),
  removeListener: jest.fn(),
  startScanning: jest.fn(),
  stopScanning: jest.fn(),
  state: 'poweredOn',
}))

/* eslint-disable import/order */
const bleScanner = require('./bleScanner')
const noble = require('@abandonware/noble')
/* eslint-enable import/order */

describe('BleScanner', () => {
  let scanner

  beforeEach(() => {
    jest.clearAllMocks()
    scanner = bleScanner.createScanner()
  })

  afterEach(() => {
    scanner.stop()
  })

  describe('createScanner()', () => {
    it('should create a scanner instance', () => {
      expect(scanner).toBeDefined()
      expect(typeof scanner.start).toBe('function')
      expect(typeof scanner.stop).toBe('function')
      expect(typeof scanner.on).toBe('function')
      expect(typeof scanner.isScanning).toBe('function')
    })
  })

  describe('start()', () => {
    it('should register stateChange handler on noble', () => {
      scanner.start()

      expect(noble.on).toHaveBeenCalledWith('stateChange', expect.any(Function))
    })

    it('should register discover handler on noble', () => {
      scanner.start()

      expect(noble.on).toHaveBeenCalledWith('discover', expect.any(Function))
    })

    it('should start scanning when noble state is poweredOn', () => {
      // Simulate stateChange being called with poweredOn
      noble.on.mockImplementation((event, callback) => {
        if (event === 'stateChange') {
          callback('poweredOn')
        }
      })

      scanner.start()

      expect(noble.startScanning).toHaveBeenCalledWith([], true)
    })

    it('should not start scanning when noble state is not poweredOn', () => {
      // Override the default state to poweredOff
      const originalState = noble.state
      Object.defineProperty(noble, 'state', {
        value: 'poweredOff',
        writable: true,
      })

      noble.on.mockImplementation((event, callback) => {
        if (event === 'stateChange') {
          callback('poweredOff')
        }
      })

      scanner.start()

      expect(noble.startScanning).not.toHaveBeenCalled()

      // Restore original state
      Object.defineProperty(noble, 'state', {
        value: originalState,
        writable: true,
      })
    })
  })

  describe('stop()', () => {
    it('should stop scanning', () => {
      scanner.start()
      scanner.stop()

      expect(noble.stopScanning).toHaveBeenCalled()
    })
  })

  describe('on()', () => {
    it('should allow registering event listeners', () => {
      const callback = jest.fn()
      scanner.on('discover', callback)

      expect(typeof scanner.on).toBe('function')
    })
  })

  describe('filterByMac()', () => {
    it('should filter peripherals by MAC addresses', () => {
      const macAddresses = ['AA:BB:CC:DD:EE:FF', '11:22:33:44:55:66']
      scanner.setMacFilter(macAddresses)

      // The filter should be set internally
      expect(scanner.getMacFilter()).toEqual(
        macAddresses.map((mac) => mac.toLowerCase())
      )
    })

    it('should normalize MAC addresses to lowercase', () => {
      const macAddresses = ['AA:BB:CC:DD:EE:FF']
      scanner.setMacFilter(macAddresses)

      expect(scanner.getMacFilter()).toEqual(['aa:bb:cc:dd:ee:ff'])
    })
  })

  describe('isScanning()', () => {
    it('should return false initially', () => {
      expect(scanner.isScanning()).toBe(false)
    })
  })
})

describe('BleScanner peripheral discovery', () => {
  let scanner
  let discoverCallback

  beforeEach(() => {
    jest.clearAllMocks()
    noble.on.mockImplementation((event, callback) => {
      if (event === 'discover') {
        discoverCallback = callback
      }
      if (event === 'stateChange') {
        callback('poweredOn')
      }
    })
    scanner = bleScanner.createScanner()
  })

  afterEach(() => {
    scanner.stop()
  })

  it('should emit discover event when peripheral is found', () => {
    const callback = jest.fn()
    scanner.on('discover', callback)
    scanner.start()

    const mockPeripheral = {
      id: 'aabbccddeeff',
      address: 'AA:BB:CC:DD:EE:FF',
      advertisement: {
        manufacturerData: Buffer.from([0x99, 0x04, 0x05]),
      },
    }

    discoverCallback(mockPeripheral)

    expect(callback).toHaveBeenCalledWith(mockPeripheral)
  })

  it('should filter peripherals by MAC address when filter is set', () => {
    const callback = jest.fn()
    scanner.on('discover', callback)
    scanner.setMacFilter(['AA:BB:CC:DD:EE:FF'])
    scanner.start()

    const matchingPeripheral = {
      id: 'aabbccddeeff',
      address: 'aa:bb:cc:dd:ee:ff',
      advertisement: {
        manufacturerData: Buffer.from([0x99, 0x04, 0x05]),
      },
    }

    const nonMatchingPeripheral = {
      id: '112233445566',
      address: '11:22:33:44:55:66',
      advertisement: {
        manufacturerData: Buffer.from([0x99, 0x04, 0x05]),
      },
    }

    discoverCallback(matchingPeripheral)
    discoverCallback(nonMatchingPeripheral)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(matchingPeripheral)
  })

  it('should only emit Ruuvi devices (manufacturer ID 0x0499)', () => {
    const callback = jest.fn()
    scanner.on('discover', callback)
    scanner.start()

    const ruuviPeripheral = {
      id: 'aabbccddeeff',
      address: 'AA:BB:CC:DD:EE:FF',
      advertisement: {
        manufacturerData: Buffer.from([0x99, 0x04, 0x05, 0x01, 0x02]),
      },
    }

    const otherPeripheral = {
      id: '112233445566',
      address: '11:22:33:44:55:66',
      advertisement: {
        manufacturerData: Buffer.from([0x00, 0x00, 0x01, 0x02]),
      },
    }

    const noDataPeripheral = {
      id: '112233445566',
      address: '11:22:33:44:55:66',
      advertisement: {},
    }

    discoverCallback(ruuviPeripheral)
    discoverCallback(otherPeripheral)
    discoverCallback(noDataPeripheral)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(ruuviPeripheral)
  })
})
