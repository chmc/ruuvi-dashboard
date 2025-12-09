import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * @template T
 * @typedef {Object} UsePollingDataOptions
 * @property {number} interval - Polling interval in milliseconds
 * @property {boolean} [enabled=true] - Whether polling is enabled
 * @property {boolean} [immediate=true] - Whether to fetch immediately on mount
 * @property {T} [initialData] - Initial data before first fetch
 * @property {(data: T) => void} [onSuccess] - Callback on successful fetch
 * @property {(error: Error) => void} [onError] - Callback on fetch error
 * @property {(data: any) => T} [transform] - Transform function for fetched data
 */

/**
 * @template T
 * @typedef {Object} UsePollingDataResult
 * @property {T | null} data - The fetched data
 * @property {boolean} loading - Whether initial loading is in progress
 * @property {string | null} error - Error message if fetch failed
 * @property {() => Promise<void>} refetch - Function to manually trigger a fetch
 */

/**
 * Custom hook for polling data at regular intervals
 * @template T
 * @param {() => Promise<T>} fetchFn - Async function that fetches data
 * @param {UsePollingDataOptions<T>} options - Polling options
 * @returns {UsePollingDataResult<T>}
 */
const usePollingData = (fetchFn, options) => {
  const {
    interval,
    enabled = true,
    immediate = true,
    initialData = null,
    onSuccess,
    onError,
    transform,
  } = options

  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(initialData === null)
  const [error, setError] = useState(null)

  // Track if this is the first fetch
  const isFirstFetch = useRef(true)
  const intervalRef = useRef(null)

  const doFetch = useCallback(async () => {
    try {
      const result = await fetchFn()
      const transformedData = transform ? transform(result) : result
      setData(transformedData)
      setError(null)
      if (onSuccess) {
        onSuccess(transformedData)
      }
    } catch (err) {
      setError(err.message)
      if (onError) {
        onError(err)
      }
    } finally {
      if (isFirstFetch.current) {
        setLoading(false)
        isFirstFetch.current = false
      }
    }
  }, [fetchFn, transform, onSuccess, onError])

  const refetch = useCallback(async () => {
    await doFetch()
  }, [doFetch])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return undefined
    }

    // Reset first fetch tracking when re-enabled
    if (isFirstFetch.current && immediate) {
      doFetch()
    }

    intervalRef.current = setInterval(() => {
      doFetch()
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, immediate, doFetch])

  return { data, loading, error, refetch }
}

export default usePollingData
