/**
 * Tests for Graceful Shutdown Handler
 *
 * Tests that the handler:
 * - Registers SIGTERM handler
 * - Registers SIGINT handler
 * - Calls flush before exit
 * - Logs shutdown message
 */

const shutdownHandler = require('./shutdownHandler')

describe('shutdownHandler', () => {
  let originalListeners
  let mockFlush
  let consoleLogSpy

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

    // Spy on console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

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

    // Restore console.log
    consoleLogSpy.mockRestore()
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
      mockExit = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined)
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

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Graceful shutdown')
      )
    })

    it('should log flush result', async () => {
      shutdownHandler.register(mockFlush)

      await shutdownHandler.triggerShutdown()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('flushed')
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
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation()

      shutdownHandler.register(errorFlush)

      await shutdownHandler.triggerShutdown()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('error'),
        expect.any(Error)
      )
      // Should still exit even on error
      expect(mockExit).toHaveBeenCalledWith(1)

      consoleErrorSpy.mockRestore()
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
