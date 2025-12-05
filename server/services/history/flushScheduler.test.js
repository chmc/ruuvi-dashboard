/**
 * Tests for Flush Scheduler
 *
 * Tests that the scheduler:
 * - Starts with correct interval
 * - Calls flush method on interval
 * - Stops properly
 * - Reads interval from environment variable
 */

const flushScheduler = require('./flushScheduler')

describe('flushScheduler', () => {
  beforeEach(() => {
    // Reset scheduler state before each test
    flushScheduler.stop()
    jest.useFakeTimers()
  })

  afterEach(() => {
    flushScheduler.stop()
    jest.useRealTimers()
    // Reset environment variable
    delete process.env.RUUVI_BUFFER_FLUSH_INTERVAL
  })

  describe('start', () => {
    it('should start with the provided interval', () => {
      const flushCallback = jest.fn()
      const intervalMs = 5000

      flushScheduler.start(intervalMs, flushCallback)

      expect(flushScheduler.isRunning()).toBe(true)

      // Callback should not be called immediately
      expect(flushCallback).not.toHaveBeenCalled()

      // Advance time by interval
      jest.advanceTimersByTime(intervalMs)

      expect(flushCallback).toHaveBeenCalledTimes(1)
    })

    it('should call flush method on each interval', () => {
      const flushCallback = jest.fn()
      const intervalMs = 1000

      flushScheduler.start(intervalMs, flushCallback)

      // Advance time by multiple intervals
      jest.advanceTimersByTime(3000)

      expect(flushCallback).toHaveBeenCalledTimes(3)
    })

    it('should not start if already running', () => {
      const flushCallback1 = jest.fn()
      const flushCallback2 = jest.fn()

      flushScheduler.start(1000, flushCallback1)
      flushScheduler.start(1000, flushCallback2)

      jest.advanceTimersByTime(1000)

      // Only first callback should be called
      expect(flushCallback1).toHaveBeenCalledTimes(1)
      expect(flushCallback2).not.toHaveBeenCalled()
    })
  })

  describe('stop', () => {
    it('should stop the scheduler', () => {
      const flushCallback = jest.fn()

      flushScheduler.start(1000, flushCallback)
      expect(flushScheduler.isRunning()).toBe(true)

      flushScheduler.stop()
      expect(flushScheduler.isRunning()).toBe(false)

      // Advance time - callback should not be called
      jest.advanceTimersByTime(5000)
      expect(flushCallback).not.toHaveBeenCalled()
    })

    it('should handle stopping when not running', () => {
      // Should not throw
      expect(() => flushScheduler.stop()).not.toThrow()
      expect(flushScheduler.isRunning()).toBe(false)
    })
  })

  describe('forceFlush', () => {
    it('should call the flush callback immediately', () => {
      const flushCallback = jest.fn().mockReturnValue({ flushedCount: 5 })

      flushScheduler.start(60000, flushCallback)

      // Force flush without waiting for interval
      const result = flushScheduler.forceFlush()

      expect(flushCallback).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ flushedCount: 5 })
    })

    it('should return null if scheduler is not running', () => {
      const result = flushScheduler.forceFlush()

      expect(result).toBeNull()
    })
  })

  describe('isRunning', () => {
    it('should return false initially', () => {
      expect(flushScheduler.isRunning()).toBe(false)
    })

    it('should return true after start', () => {
      flushScheduler.start(1000, jest.fn())
      expect(flushScheduler.isRunning()).toBe(true)
    })

    it('should return false after stop', () => {
      flushScheduler.start(1000, jest.fn())
      flushScheduler.stop()
      expect(flushScheduler.isRunning()).toBe(false)
    })
  })

  describe('getDefaultIntervalMs', () => {
    it('should return default interval when env var not set', () => {
      delete process.env.RUUVI_BUFFER_FLUSH_INTERVAL

      // Default is 15 minutes (900 seconds = 900000 ms)
      expect(flushScheduler.getDefaultIntervalMs()).toBe(900000)
    })

    it('should read interval from RUUVI_BUFFER_FLUSH_INTERVAL env var', () => {
      // Env var is in seconds
      process.env.RUUVI_BUFFER_FLUSH_INTERVAL = '60'

      expect(flushScheduler.getDefaultIntervalMs()).toBe(60000)
    })

    it('should handle invalid env var value', () => {
      process.env.RUUVI_BUFFER_FLUSH_INTERVAL = 'invalid'

      // Should fall back to default
      expect(flushScheduler.getDefaultIntervalMs()).toBe(900000)
    })

    it('should handle negative env var value', () => {
      process.env.RUUVI_BUFFER_FLUSH_INTERVAL = '-100'

      // Should fall back to default
      expect(flushScheduler.getDefaultIntervalMs()).toBe(900000)
    })

    it('should handle zero env var value', () => {
      process.env.RUUVI_BUFFER_FLUSH_INTERVAL = '0'

      // Should fall back to default
      expect(flushScheduler.getDefaultIntervalMs()).toBe(900000)
    })
  })

  describe('getLastFlushTime', () => {
    it('should return null when never flushed', () => {
      flushScheduler.start(60000, jest.fn())
      expect(flushScheduler.getLastFlushTime()).toBeNull()
    })

    it('should return timestamp after flush', () => {
      const flushCallback = jest.fn()
      const now = Date.now()
      jest.setSystemTime(now)

      flushScheduler.start(1000, flushCallback)
      jest.advanceTimersByTime(1000)

      expect(flushScheduler.getLastFlushTime()).toBe(now + 1000)
    })

    it('should update after each flush', () => {
      const flushCallback = jest.fn()
      const startTime = Date.now()
      jest.setSystemTime(startTime)

      flushScheduler.start(1000, flushCallback)

      jest.advanceTimersByTime(1000)
      expect(flushScheduler.getLastFlushTime()).toBe(startTime + 1000)

      jest.advanceTimersByTime(1000)
      expect(flushScheduler.getLastFlushTime()).toBe(startTime + 2000)
    })

    it('should update after forceFlush', () => {
      const flushCallback = jest.fn()
      const now = Date.now()
      jest.setSystemTime(now)

      flushScheduler.start(60000, flushCallback)
      flushScheduler.forceFlush()

      expect(flushScheduler.getLastFlushTime()).toBe(now)
    })
  })
})
