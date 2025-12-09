const fs = require('fs')
const path = require('path')

// Mock fs module with promises
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}))

// Mock logger module
jest.mock('./utils/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}))

const storage = require('./storage')

describe('storage', () => {
  const mockStoragePath = path.resolve(__dirname, 'appStorage.json')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('loadOrDefaultSync', () => {
    it('should return empty object when file does not exist', () => {
      fs.existsSync.mockReturnValue(false)

      const result = storage.loadOrDefaultSync()

      expect(result).toEqual({})
      expect(fs.existsSync).toHaveBeenCalledWith(mockStoragePath)
    })

    it('should load and parse JSON from file when it exists', () => {
      const mockData = {
        todayEnergyPrices: { data: [{ hour: 0, price: 5.0 }] },
      }

      fs.existsSync.mockReturnValue(true)
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData))

      const result = storage.loadOrDefaultSync()

      expect(result).toEqual(mockData)
      expect(fs.readFileSync).toHaveBeenCalledWith(mockStoragePath)
    })

    it('should parse ISO date strings as Date objects', () => {
      const dateStr = '2023-10-24T12:00:00.000Z'
      const mockData = {
        updatedAt: dateStr,
      }

      fs.existsSync.mockReturnValue(true)
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData))

      const result = storage.loadOrDefaultSync()

      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.updatedAt.toISOString()).toBe(dateStr)
    })

    it('should return empty object on JSON parse error', () => {
      fs.existsSync.mockReturnValue(true)
      fs.readFileSync.mockReturnValue('invalid json {{{')

      const result = storage.loadOrDefaultSync()

      expect(result).toEqual({})
      // Logger is mocked - error is logged internally
    })
  })

  describe('loadOrDefault', () => {
    it('should return empty object when file does not exist', async () => {
      fs.existsSync.mockReturnValue(false)

      const result = await storage.loadOrDefault()

      expect(result).toEqual({})
    })

    it('should return parsed data when file exists', async () => {
      const mockData = { test: 'data', value: 123 }
      fs.existsSync.mockReturnValue(true)
      fs.promises.readFile.mockResolvedValue(JSON.stringify(mockData))

      const result = await storage.loadOrDefault()

      expect(result).toEqual(mockData)
    })

    it('should parse ISO date strings as Date objects', async () => {
      const dateStr = '2023-10-24T12:00:00.000Z'
      const mockData = { updatedAt: dateStr }
      fs.existsSync.mockReturnValue(true)
      fs.promises.readFile.mockResolvedValue(JSON.stringify(mockData))

      const result = await storage.loadOrDefault()

      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.updatedAt.toISOString()).toBe(dateStr)
    })

    it('should return empty object on read error', async () => {
      fs.existsSync.mockReturnValue(true)
      fs.promises.readFile.mockRejectedValue(new Error('Read failed'))

      const result = await storage.loadOrDefault()

      expect(result).toEqual({})
    })

    it('should return empty object on JSON parse error', async () => {
      fs.existsSync.mockReturnValue(true)
      fs.promises.readFile.mockResolvedValue('invalid json {{{')

      const result = await storage.loadOrDefault()

      expect(result).toEqual({})
    })
  })

  describe('saveSync', () => {
    it('should write JSON to file', () => {
      const data = { test: 'value', number: 123 }

      storage.saveSync(data)

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockStoragePath,
        JSON.stringify(data)
      )
    })

    it('should handle complex objects', () => {
      const data = {
        todayEnergyPrices: {
          data: [{ hour: 0, price: 5.0 }],
          updatedAt: new Date('2023-10-24'),
        },
      }

      storage.saveSync(data)

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockStoragePath,
        expect.any(String)
      )
    })
  })

  describe('save', () => {
    it('should write JSON to file asynchronously', async () => {
      const data = { test: 'async value' }
      fs.promises.writeFile.mockResolvedValue(undefined)

      await storage.save(data)

      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        mockStoragePath,
        JSON.stringify(data)
      )
    })

    it('should handle write errors gracefully', async () => {
      const data = { test: 'data' }
      fs.promises.writeFile.mockRejectedValue(new Error('Write failed'))

      // Should not throw
      await expect(storage.save(data)).resolves.toBeUndefined()
      expect(fs.promises.writeFile).toHaveBeenCalled()
    })

    it('should complete before returning', async () => {
      const data = { test: 'data' }
      let writeCompleted = false
      fs.promises.writeFile.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              writeCompleted = true
              resolve()
            }, 10)
          })
      )

      await storage.save(data)

      expect(writeCompleted).toBe(true)
    })
  })

  describe('jsonParseReviverFunc (date parsing)', () => {
    it('should parse valid ISO date strings', () => {
      const jsonWithDates = JSON.stringify({
        date1: '2023-10-24T12:00:00.000Z',
        date2: '2023-01-01T00:00:00.000Z',
        notDate: 'some string',
        number: 123,
      })

      fs.existsSync.mockReturnValue(true)
      fs.readFileSync.mockReturnValue(jsonWithDates)

      const result = storage.loadOrDefaultSync()

      expect(result.date1).toBeInstanceOf(Date)
      expect(result.date2).toBeInstanceOf(Date)
      expect(result.notDate).toBe('some string')
      expect(result.number).toBe(123)
    })

    it('should not parse strings that look similar but are not ISO dates', () => {
      const jsonWithInvalidDates = JSON.stringify({
        notDate1: '2023-10-24', // Missing time
        notDate2: '2023-10-24T12:00:00', // Missing milliseconds and Z
        notDate3: '24-10-2023T12:00:00.000Z', // Wrong format
      })

      fs.existsSync.mockReturnValue(true)
      fs.readFileSync.mockReturnValue(jsonWithInvalidDates)

      const result = storage.loadOrDefaultSync()

      expect(result.notDate1).toBe('2023-10-24')
      expect(result.notDate2).toBe('2023-10-24T12:00:00')
      expect(result.notDate3).toBe('24-10-2023T12:00:00.000Z')
    })
  })
})
