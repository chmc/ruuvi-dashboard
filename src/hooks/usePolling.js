import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom React hook for periodic API polling with automatic error handling,
 * retry logic, and cleanup.
 *
 * This hook follows the same patterns as useSensorStream but is designed for
 * standard HTTP polling of REST APIs rather than SSE connections.
 *
 * @param {function} fetchFunction - Async function that fetches data (should return a Promise)
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether polling should be active (default: true)
 * @param {number} options.interval - Polling interval in milliseconds (default: 30000)
 * @param {boolean} options.fetchOnMount - Fetch immediately on mount (default: true)
 * @param {number} options.retryAttempts - Number of retry attempts on error (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 5000)
 * @param {function} options.onSuccess - Callback when data is successfully fetched
 * @param {function} options.onError - Callback when an error occurs
 * @param {function} options.onRetry - Callback when a retry is attempted
 *
 * @returns {Object} Hook state and controls
 * @property {*} data - Latest data from the fetch function
 * @property {boolean} isLoading - Whether a fetch is currently in progress
 * @property {string|null} error - Error message if fetch failed
 * @property {function} refetch - Manual refetch function to trigger immediate fetch
 * @property {number} lastFetchTime - Timestamp of last successful fetch
 * @property {boolean} isPolling - Whether polling is currently active
 *
 * @example
 * const { data, isLoading, error, refetch } = usePolling(
 *   async () => {
 *     const response = await fetch('/api/energyprices')
 *     return response.json()
 *   },
 *   {
 *     interval: 30 * 60 * 1000, // 30 minutes
 *     onError: (err) => console.error('Polling error:', err)
 *   }
 * );
 */
export const usePolling = (fetchFunction, options = {}) => {
  const {
    enabled = true,
    interval = 30000,
    fetchOnMount = true,
    retryAttempts = 3,
    retryDelay = 5000,
    onSuccess,
    onError,
    onRetry,
  } = options

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetchTime, setLastFetchTime] = useState(null)
  const [isPolling, setIsPolling] = useState(false)

  // Use refs to track mutable state across renders
  const intervalRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const currentRetryAttemptRef = useRef(0)
  const isMountedRef = useRef(true)
  const isCurrentlyFetchingRef = useRef(false)

  /**
   * Cleanup function to clear intervals and timeouts
   */
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    setIsPolling(false)
  }, [])

  /**
   * Execute the fetch operation with error handling and retry logic
   */
  const executeFetch = useCallback(
    async (isRetry = false) => {
      // Prevent concurrent fetches
      if (isCurrentlyFetchingRef.current) {
        console.log('Fetch already in progress, skipping...')
        return
      }

      // Don't fetch if component is unmounted
      if (!isMountedRef.current) {
        return
      }

      try {
        isCurrentlyFetchingRef.current = true
        setIsLoading(true)
        setError(null)

        const result = await fetchFunction()

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setData(result)
          setLastFetchTime(Date.now())
          currentRetryAttemptRef.current = 0 // Reset retry counter on success

          if (onSuccess) {
            onSuccess(result)
          }
        }
      } catch (err) {
        console.error('Polling fetch error:', err)

        if (!isMountedRef.current) {
          return
        }

        const errorMessage = err.message || 'Failed to fetch data'
        setError(errorMessage)

        if (onError) {
          onError(err)
        }

        // Implement retry logic
        if (currentRetryAttemptRef.current < retryAttempts && !isRetry) {
          currentRetryAttemptRef.current += 1

          const retryMsg = `Retry attempt ${
            currentRetryAttemptRef.current
          }/${retryAttempts} in ${retryDelay / 1000}s...`
          console.log(retryMsg)

          if (onRetry) {
            onRetry(currentRetryAttemptRef.current, retryAttempts)
          }

          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              executeFetch(true)
            }
          }, retryDelay)
        } else if (currentRetryAttemptRef.current >= retryAttempts) {
          console.error(`Max retry attempts (${retryAttempts}) reached`)
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
          isCurrentlyFetchingRef.current = false
        }
      }
    },
    [fetchFunction, retryAttempts, retryDelay, onSuccess, onError, onRetry]
  )

  /**
   * Manual refetch function that can be called by the component
   * Resets retry attempts and triggers immediate fetch
   */
  const refetch = useCallback(() => {
    console.log('Manual refetch triggered')
    currentRetryAttemptRef.current = 0
    executeFetch(false)
  }, [executeFetch])

  /**
   * Start polling interval
   */
  const startPolling = useCallback(() => {
    if (!enabled || intervalRef.current) {
      return
    }

    console.log(`Starting polling with interval: ${interval}ms`)
    setIsPolling(true)

    // Fetch immediately if fetchOnMount is true
    if (fetchOnMount) {
      executeFetch()
    }

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        executeFetch()
      }
    }, interval)
  }, [enabled, interval, fetchOnMount, executeFetch])

  /**
   * Effect to manage polling lifecycle
   */
  useEffect(() => {
    isMountedRef.current = true

    if (enabled) {
      startPolling()
    } else {
      cleanup()
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      isMountedRef.current = false
      cleanup()
    }
  }, [enabled, startPolling, cleanup])

  return {
    data,
    isLoading,
    error,
    refetch,
    lastFetchTime,
    isPolling,
  }
}

/**
 * Specialized hook for fetching multiple related data sources with a single interval
 * Useful for fetching energy prices and weather forecast together
 *
 * @param {Object} fetchFunctions - Object with named async fetch functions
 * @param {Object} options - Configuration options (same as usePolling)
 *
 * @returns {Object} Hook state with data for each fetch function
 * @property {Object} data - Object with keys matching fetchFunctions keys
 * @property {boolean} isLoading - Whether any fetch is in progress
 * @property {Object} errors - Object with error messages for each key
 * @property {function} refetch - Refetch all data sources
 * @property {function} refetchOne - Refetch a specific data source by key
 *
 * @example
 * const { data, isLoading, errors, refetch } = useMultiPolling({
 *   energyPrices: async () => {
 *     const res = await fetch('/api/energyprices')
 *     return res.json()
 *   },
 *   weather: async () => {
 *     const res = await fetch('/api/weather')
 *     return res.json()
 *   }
 * }, { interval: 30 * 60 * 1000 });
 */
export const useMultiPolling = (fetchFunctions, options = {}) => {
  const [data, setData] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [lastFetchTime, setLastFetchTime] = useState(null)

  const isMountedRef = useRef(true)

  const {
    enabled = true,
    interval = 30000,
    fetchOnMount = true,
    onSuccess,
    onError,
  } = options

  /**
   * Execute all fetch functions
   */
  const executeFetchAll = useCallback(async () => {
    if (!isMountedRef.current) return

    setIsLoading(true)
    const newData = {}
    const newErrors = {}

    // Execute all fetch functions in parallel
    await Promise.allSettled(
      Object.entries(fetchFunctions).map(async ([key, fetchFn]) => {
        try {
          const result = await fetchFn()
          newData[key] = result
        } catch (err) {
          console.error(`Multi-polling error for ${key}:`, err)
          newErrors[key] = err.message || 'Failed to fetch data'

          if (onError) {
            onError(key, err)
          }
        }
      })
    )

    if (isMountedRef.current) {
      setData((prev) => ({ ...prev, ...newData }))
      setErrors(newErrors)
      setLastFetchTime(Date.now())
      setIsLoading(false)

      if (onSuccess && Object.keys(newData).length > 0) {
        onSuccess(newData)
      }
    }
  }, [fetchFunctions, onSuccess, onError])

  /**
   * Refetch a specific data source by key
   */
  const refetchOne = useCallback(
    async (key) => {
      if (!fetchFunctions[key] || !isMountedRef.current) {
        console.warn(`No fetch function found for key: ${key}`)
        return
      }

      try {
        const result = await fetchFunctions[key]()
        if (isMountedRef.current) {
          setData((prev) => ({ ...prev, [key]: result }))
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors[key]
            return newErrors
          })
        }
      } catch (err) {
        console.error(`Refetch error for ${key}:`, err)
        if (isMountedRef.current) {
          setErrors((prev) => ({ ...prev, [key]: err.message }))
        }
        if (onError) {
          onError(key, err)
        }
      }
    },
    [fetchFunctions, onError]
  )

  // Use the standard usePolling hook for interval management
  usePolling(executeFetchAll, {
    enabled,
    interval,
    fetchOnMount,
    onError: (err) => {
      if (onError) {
        onError('all', err)
      }
    },
  })

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    data,
    isLoading,
    errors,
    refetch: executeFetchAll,
    refetchOne,
    lastFetchTime,
  }
}

export default usePolling
