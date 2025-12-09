/**
 * Tests for Graceful Shutdown Handler
 *
 * Tests that the handler:
 * - Registers SIGTERM handler
 * - Registers SIGINT handler
 * - Calls flush before exit
 * - Logs shutdown message
 */

// Create mock logger functions that we can spy on
const mockLogInfo = jest.fn()
const mockLogError = jest.fn()

// Mock logger module before importing shutdownHandler
jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: mockLogInfo,
    error: mockLogError,
    debug: jest.fn(),
    warn: jest.fn(),
  }),
}))

const shutdownHandler = require('./shutdownHandler')

describe('shutdownHandler', () => {
  let originalListeners
  let mockFlush

  beforeEach(() => {
    // Store original process event listeners
    originalListeners = {
      SIGTERM: process.listeners('SIGTERM'),
      SIGINT: process.listeners('SIGINT'),
    }

    // Remove existing listeners to test in isolation
    process.removeAllListeners('SIGTERM')
    process.removeAllListeners('SIGINT')

    // Create mock flush callback
    mockFlush = jest.fn().mockResolvedValue({ flushedCount: 5 })

    // Clear mock logger calls
    mockLogInfo.mockClear()
    mockLogError.mockClear()

    // Reset handler state
    shutdownHandler.reset()
  })

  afterEach(() => {
    // Reset handler state
    shutdownHandler.reset()

    // Restore original listeners
    process.removeAllListeners('SIGTERM')
    process.removeAllListeners('SIGINT')
    originalListeners.SIGTERM.forEach((listener) => {
      process.on('SIGTERM', listener)
    })
    originalListeners.SIGINT.forEach((listener) => {
      process.on('SIGINT', listener)
    })
  })

  describe('register', () => {
    it('should register SIGTERM handler', () => {
      expect(process.listenerCount('SIGTERM')).toBe(0)

      shutdownHandler.register(mockFlush)

      expect(process.listenerCount('SIGTERM')).toBe(1)
    })

    it('should register SIGINT handler', () => {
      expect(process.listenerCount('SIGINT')).toBe(0)

      shutdownHandler.register(mockFlush)

      expect(process.listenerCount('SIGINT')).toBe(1)
    })

    it('should not register handlers twice', () => {
      shutdownHandler.register(mockFlush)
      shutdownHandler.register(mockFlush)

      expect(process.listenerCount('SIGTERM')).toBe(1)
      expect(process.listenerCount('SIGINT')).toBe(1)
    })

    it('should be registered after calling register', () => {
      expect(shutdownHandler.isRegistered()).toBe(false)

      shutdownHandler.register(mockFlush)

      expect(shutdownHandler.isRegistered()).toBe(true)
    })
  })

  describe('shutdown behavior', () => {
    let mockExit

    beforeEach(() => {
      // Mock process.exit to prevent actual exit
      mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined)
    })

    afterEach(() => {
      mockExit.mockRestore()
    })

    it('should call flush when shutdown is triggered', async () => {
      shutdownHandler.register(mockFlush)

      // Trigger shutdown
      await shutdownHandler.triggerShutdown()

      expect(mockFlush).toHaveBeenCalledTimes(1)
    })

    it('should log shutdown message', async () => {
      shutdownHandler.register(mockFlush)

      await shutdownHandler.triggerShutdown()

      expect(mockLogInfo).toHaveBeenCalledWith(
        expect.objectContaining({ signal: 'manual' }),
        'Graceful shutdown initiated'
      )
    })

    it('should log flush result', async () => {
      shutdownHandler.register(mockFlush)

      await shutdownHandler.triggerShutdown()

      expect(mockLogInfo).toHaveBeenCalledWith(
        expect.objectContaining({ flushedCount: 5 }),
        'Buffer flushed'
      )
    })

    it('should call process.exit after flush completes', async () => {
      shutdownHandler.register(mockFlush)

      await shutdownHandler.triggerShutdown()

      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should handle sync flush callback', async () => {
      const syncFlush = jest.fn().mockReturnValue({ flushedCount: 3 })
      shutdownHandler.register(syncFlush)

      await shutdownHandler.triggerShutdown()

      expect(syncFlush).toHaveBeenCalledTimes(1)
      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should handle flush errors gracefully', async () => {
      const errorFlush = jest.fn().mockRejectedValue(new Error('Flush failed'))

      shutdownHandler.register(errorFlush)

      await shutdownHandler.triggerShutdown()

      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error) }),
        'Shutdown error'
      )
      // Should still exit even on error
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should prevent multiple shutdown calls', async () => {
      shutdownHandler.register(mockFlush)

      // Trigger shutdown multiple times
      const promise1 = shutdownHandler.triggerShutdown()
      const promise2 = shutdownHandler.triggerShutdown()

      await Promise.all([promise1, promise2])

      // Flush should only be called once
      expect(mockFlush).toHaveBeenCalledTimes(1)
    })

    it('should call scanner stop callback before flush', async () => {
      const mockScannerStop = jest.fn()
      shutdownHandler.register(mockFlush)
      shutdownHandler.registerScannerStop(mockScannerStop)

      await shutdownHandler.triggerShutdown()

      expect(mockScannerStop).toHaveBeenCalledTimes(1)
      expect(mockFlush).toHaveBeenCalledTimes(1)
      // Verify order: scanner stop should be called first (check log order)
      const logCalls = mockLogInfo.mock.calls.map((call) => call[1] || call[0])
      const scannerStopIndex = logCalls.findIndex((msg) =>
        String(msg).includes('Stopping BLE scanner')
      )
      const flushIndex = logCalls.findIndex((msg) =>
        String(msg).includes('Flushing buffer')
      )
      expect(scannerStopIndex).toBeGreaterThan(-1)
      expect(flushIndex).toBeGreaterThan(-1)
      expect(scannerStopIndex).toBeLessThan(flushIndex)
    })

    it('should work without scanner stop callback', async () => {
      shutdownHandler.register(mockFlush)
      // Don't register scanner stop

      await shutdownHandler.triggerShutdown()

      expect(mockFlush).toHaveBeenCalledTimes(1)
      expect(mockExit).toHaveBeenCalledWith(0)
    })
  })

  describe('reset', () => {
    it('should remove signal handlers', () => {
      shutdownHandler.register(mockFlush)
      expect(process.listenerCount('SIGTERM')).toBe(1)
      expect(process.listenerCount('SIGINT')).toBe(1)

      shutdownHandler.reset()

      expect(process.listenerCount('SIGTERM')).toBe(0)
      expect(process.listenerCount('SIGINT')).toBe(0)
    })

    it('should allow re-registration after reset', () => {
      shutdownHandler.register(mockFlush)
      shutdownHandler.reset()

      expect(shutdownHandler.isRegistered()).toBe(false)

      shutdownHandler.register(mockFlush)

      expect(shutdownHandler.isRegistered()).toBe(true)
      expect(process.listenerCount('SIGTERM')).toBe(1)
    })
  })
})
