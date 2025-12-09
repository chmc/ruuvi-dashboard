const pino = require('pino')

describe('logger', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('configuration', () => {
    it('should export a pino logger instance', () => {
      const logger = require('./logger')
      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.debug).toBe('function')
    })

    it('should have default log level of info when not in test mode', () => {
      // Temporarily unset NODE_ENV to test default behavior
      delete process.env.NODE_ENV
      const logger = require('./logger')
      expect(logger.level).toBe('info')
    })

    it('should respect LOG_LEVEL environment variable', () => {
      delete process.env.NODE_ENV
      process.env.LOG_LEVEL = 'debug'
      const logger = require('./logger')
      expect(logger.level).toBe('debug')
    })

    it('should use silent level in test mode', () => {
      process.env.NODE_ENV = 'test'
      const logger = require('./logger')
      expect(logger.level).toBe('silent')
    })
  })

  describe('child loggers', () => {
    it('should create child logger with module name', () => {
      const { createLogger } = require('./logger')
      const childLogger = createLogger('myModule')
      expect(childLogger).toBeDefined()
      expect(typeof childLogger.info).toBe('function')
    })

    it('should include module name in bindings', () => {
      const { createLogger } = require('./logger')
      const childLogger = createLogger('testModule')
      const bindings = childLogger.bindings()
      expect(bindings.module).toBe('testModule')
    })
  })

  describe('logging methods', () => {
    let mockDestination
    let testLogger

    beforeEach(() => {
      mockDestination = {
        write: jest.fn(),
      }
      testLogger = pino({ level: 'trace' }, mockDestination)
    })

    it('should log info messages', () => {
      testLogger.info('test info message')
      expect(mockDestination.write).toHaveBeenCalled()
      const logEntry = JSON.parse(mockDestination.write.mock.calls[0][0])
      expect(logEntry.level).toBe(30) // pino info level
      expect(logEntry.msg).toBe('test info message')
    })

    it('should log error messages with error objects', () => {
      const testError = new Error('test error')
      testLogger.error({ err: testError }, 'error occurred')
      expect(mockDestination.write).toHaveBeenCalled()
      const logEntry = JSON.parse(mockDestination.write.mock.calls[0][0])
      expect(logEntry.level).toBe(50) // pino error level
      expect(logEntry.err).toBeDefined()
      expect(logEntry.err.message).toBe('test error')
    })

    it('should log warn messages', () => {
      testLogger.warn('test warning')
      expect(mockDestination.write).toHaveBeenCalled()
      const logEntry = JSON.parse(mockDestination.write.mock.calls[0][0])
      expect(logEntry.level).toBe(40) // pino warn level
    })

    it('should log debug messages', () => {
      testLogger.debug('debug message')
      expect(mockDestination.write).toHaveBeenCalled()
      const logEntry = JSON.parse(mockDestination.write.mock.calls[0][0])
      expect(logEntry.level).toBe(20) // pino debug level
    })

    it('should log with additional context', () => {
      testLogger.info(
        { mac: 'AA:BB:CC:DD:EE:FF', temperature: 22.5 },
        'sensor reading'
      )
      const logEntry = JSON.parse(mockDestination.write.mock.calls[0][0])
      expect(logEntry.mac).toBe('AA:BB:CC:DD:EE:FF')
      expect(logEntry.temperature).toBe(22.5)
      expect(logEntry.msg).toBe('sensor reading')
    })
  })

  describe('timestamp format', () => {
    it('should include timestamp in log output', () => {
      const mockDestination = { write: jest.fn() }
      const testLogger = pino({ level: 'info' }, mockDestination)
      testLogger.info('test message')
      const logEntry = JSON.parse(mockDestination.write.mock.calls[0][0])
      expect(logEntry.time).toBeDefined()
      expect(typeof logEntry.time).toBe('number')
    })
  })
})
