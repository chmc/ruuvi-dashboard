import { renderHook, act, waitFor } from '@testing-library/react'
import usePollingData from './usePollingData'

describe('usePollingData', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('initial fetch', () => {
    it('should call fetchFn immediately on mount', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      renderHook(() => usePollingData(fetchFn, { interval: 10000 }))

      expect(fetchFn).toHaveBeenCalledTimes(1)
    })

    it('should set data from fetchFn result', async () => {
      const mockData = { temperature: 22.5 }
      const fetchFn = jest.fn().mockResolvedValue(mockData)

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })
    })

    it('should set loading to true initially', () => {
      const fetchFn = jest.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      expect(result.current.loading).toBe(true)
    })

    it('should set loading to false after fetch completes', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should set error when fetch fails', async () => {
      const fetchFn = jest.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })
    })

    it('should set loading to false even when fetch fails', async () => {
      const fetchFn = jest.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('polling', () => {
    it('should poll at specified interval', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      renderHook(() => usePollingData(fetchFn, { interval: 10000 }))

      // Initial call
      expect(fetchFn).toHaveBeenCalledTimes(1)

      // Advance timer by 10 seconds
      await act(async () => {
        jest.advanceTimersByTime(10000)
      })

      expect(fetchFn).toHaveBeenCalledTimes(2)

      // Advance another 10 seconds
      await act(async () => {
        jest.advanceTimersByTime(10000)
      })

      expect(fetchFn).toHaveBeenCalledTimes(3)
    })

    it('should not set loading to true during polling updates', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Advance timer to trigger poll
      await act(async () => {
        jest.advanceTimersByTime(10000)
      })

      // Loading should still be false during polling
      expect(result.current.loading).toBe(false)
    })

    it('should update data on subsequent polls', async () => {
      const fetchFn = jest
        .fn()
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 2 })

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      await waitFor(() => {
        expect(result.current.data).toEqual({ count: 1 })
      })

      // Advance timer to trigger poll
      await act(async () => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(result.current.data).toEqual({ count: 2 })
      })
    })

    it('should clear error on successful poll after failure', async () => {
      const fetchFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: 'test' })

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })

      // Advance timer to trigger poll
      await act(async () => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
        expect(result.current.data).toEqual({ data: 'test' })
      })
    })
  })

  describe('cleanup', () => {
    it('should clear interval on unmount', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      const { unmount } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      expect(fetchFn).toHaveBeenCalledTimes(1)

      unmount()

      // Advance timer - should not call fetchFn after unmount
      await act(async () => {
        jest.advanceTimersByTime(10000)
      })

      expect(fetchFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('enabled option', () => {
    it('should not fetch when enabled is false', () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      renderHook(() =>
        usePollingData(fetchFn, { interval: 10000, enabled: false })
      )

      expect(fetchFn).not.toHaveBeenCalled()
    })

    it('should start fetching when enabled changes from false to true', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      const { rerender } = renderHook(
        ({ enabled }) => usePollingData(fetchFn, { interval: 10000, enabled }),
        { initialProps: { enabled: false } }
      )

      expect(fetchFn).not.toHaveBeenCalled()

      rerender({ enabled: true })

      await waitFor(() => {
        expect(fetchFn).toHaveBeenCalledTimes(1)
      })
    })

    it('should stop polling when enabled changes from true to false', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      const { rerender } = renderHook(
        ({ enabled }) => usePollingData(fetchFn, { interval: 10000, enabled }),
        { initialProps: { enabled: true } }
      )

      await waitFor(() => {
        expect(fetchFn).toHaveBeenCalledTimes(1)
      })

      rerender({ enabled: false })

      // Advance timer - should not call fetchFn
      await act(async () => {
        jest.advanceTimersByTime(10000)
      })

      expect(fetchFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('refetch function', () => {
    it('should provide a refetch function', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      expect(typeof result.current.refetch).toBe('function')
    })

    it('should call fetchFn when refetch is invoked', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      await waitFor(() => {
        expect(fetchFn).toHaveBeenCalledTimes(1)
      })

      await act(async () => {
        await result.current.refetch()
      })

      expect(fetchFn).toHaveBeenCalledTimes(2)
    })

    it('should update data when refetch is called', async () => {
      const fetchFn = jest
        .fn()
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 2 })

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000 })
      )

      await waitFor(() => {
        expect(result.current.data).toEqual({ count: 1 })
      })

      await act(async () => {
        await result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.data).toEqual({ count: 2 })
      })
    })
  })

  describe('onSuccess callback', () => {
    it('should call onSuccess with data after successful fetch', async () => {
      const mockData = { temperature: 22.5 }
      const fetchFn = jest.fn().mockResolvedValue(mockData)
      const onSuccess = jest.fn()

      renderHook(() => usePollingData(fetchFn, { interval: 10000, onSuccess }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockData)
      })
    })

    it('should not call onSuccess when fetch fails', async () => {
      const fetchFn = jest.fn().mockRejectedValue(new Error('Network error'))
      const onSuccess = jest.fn()

      renderHook(() => usePollingData(fetchFn, { interval: 10000, onSuccess }))

      await waitFor(() => {
        expect(fetchFn).toHaveBeenCalled()
      })

      // Give time for any potential onSuccess call
      await act(async () => {
        jest.advanceTimersByTime(100)
      })

      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('onError callback', () => {
    it('should call onError with error after failed fetch', async () => {
      const error = new Error('Network error')
      const fetchFn = jest.fn().mockRejectedValue(error)
      const onError = jest.fn()

      renderHook(() => usePollingData(fetchFn, { interval: 10000, onError }))

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error)
      })
    })

    it('should not call onError when fetch succeeds', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })
      const onError = jest.fn()

      renderHook(() => usePollingData(fetchFn, { interval: 10000, onError }))

      await waitFor(() => {
        expect(fetchFn).toHaveBeenCalled()
      })

      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('transform option', () => {
    it('should transform data using provided function', async () => {
      const fetchFn = jest.fn().mockResolvedValue([
        { mac: 'mac1', temp: 22 },
        { mac: 'mac2', temp: 18 },
      ])
      const transform = (data) =>
        data.reduce((acc, item) => ({ ...acc, [item.mac]: item }), {})

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000, transform })
      )

      await waitFor(() => {
        expect(result.current.data).toEqual({
          mac1: { mac: 'mac1', temp: 22 },
          mac2: { mac: 'mac2', temp: 18 },
        })
      })
    })
  })

  describe('multiple intervals support', () => {
    it('should handle changing interval', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      const { rerender } = renderHook(
        ({ interval }) => usePollingData(fetchFn, { interval }),
        { initialProps: { interval: 10000 } }
      )

      await waitFor(() => {
        expect(fetchFn).toHaveBeenCalledTimes(1)
      })

      // Change interval to 5000
      rerender({ interval: 5000 })

      // Advance by 5 seconds
      await act(async () => {
        jest.advanceTimersByTime(5000)
      })

      expect(fetchFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('immediate option', () => {
    it('should not fetch immediately when immediate is false', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      renderHook(() =>
        usePollingData(fetchFn, { interval: 10000, immediate: false })
      )

      expect(fetchFn).not.toHaveBeenCalled()

      // Should fetch after interval
      await act(async () => {
        jest.advanceTimersByTime(10000)
      })

      expect(fetchFn).toHaveBeenCalledTimes(1)
    })

    it('should fetch immediately by default', () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      renderHook(() => usePollingData(fetchFn, { interval: 10000 }))

      expect(fetchFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('initialData option', () => {
    it('should use initialData before first fetch completes', () => {
      const fetchFn = jest.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      const initialData = { temperature: 0 }

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000, initialData })
      )

      expect(result.current.data).toEqual(initialData)
    })

    it('should replace initialData with fetched data', async () => {
      const fetchedData = { temperature: 22.5 }
      const fetchFn = jest.fn().mockResolvedValue(fetchedData)
      const initialData = { temperature: 0 }

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000, initialData })
      )

      expect(result.current.data).toEqual(initialData)

      await waitFor(() => {
        expect(result.current.data).toEqual(fetchedData)
      })
    })

    it('should set loading to false when initialData is provided', () => {
      const fetchFn = jest.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      const initialData = { temperature: 0 }

      const { result } = renderHook(() =>
        usePollingData(fetchFn, { interval: 10000, initialData })
      )

      // With initialData, we have data so loading should be false
      expect(result.current.loading).toBe(false)
    })
  })
})
