import { usePolling } from './usePolling'
import apiService from '../services/api'

/**
 * Custom React hook for fetching today's min/max temperature data
 * with automatic polling and error handling.
 *
 * This hook uses the generic usePolling hook internally but provides
 * a specialized interface for temperature data.
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether polling should be active (default: true)
 * @param {number} options.interval - Polling interval in milliseconds (default: 10000)
 * @param {function} options.onSuccess - Callback when data is successfully fetched
 * @param {function} options.onError - Callback when an error occurs
 *
 * @returns {Object} Hook state and controls
 * @property {Object|null} data - Today's min/max temperature data
 * @property {boolean} isLoading - Whether a fetch is currently in progress
 * @property {string|null} error - Error message if fetch failed
 * @property {function} refetch - Manual refetch function
 * @property {number} lastFetchTime - Timestamp of last successful fetch
 *
 * @example
 * const { data: todayMinMax, isLoading, error } = useMinMaxTemperature({
 *   interval: 10000, // 10 seconds
 *   onError: (err) => console.error('Failed to fetch min/max:', err)
 * });
 */
export const useMinMaxTemperature = (options = {}) => {
  const {
    enabled = true,
    interval = 10000, // 10 seconds default
    onSuccess,
    onError,
  } = options

  return usePolling(
    async () => {
      const minMaxData = await apiService.fetchMinMaxTemperatures()
      return minMaxData
    },
    {
      enabled,
      interval,
      fetchOnMount: true,
      retryAttempts: 3,
      retryDelay: 2000, // 2 second retry delay for quick recovery
      onSuccess,
      onError,
    }
  )
}

export default useMinMaxTemperature
