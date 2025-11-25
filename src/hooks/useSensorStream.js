import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom React hook for Server-Sent Events (SSE) integration with automatic reconnection
 * and error handling.
 *
 * @param {string} url - The SSE endpoint URL to connect to
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether the connection should be active (default: true)
 * @param {number} options.reconnectInterval - Initial reconnection delay in ms (default: 1000)
 * @param {number} options.maxReconnectInterval - Maximum reconnection delay in ms (default: 30000)
 * @param {number} options.reconnectDecay - Exponential backoff multiplier (default: 1.5)
 * @param {number} options.maxReconnectAttempts - Maximum reconnection attempts (default: Infinity)
 * @param {function} options.onConnect - Callback when connection opens
 * @param {function} options.onDisconnect - Callback when connection closes
 * @param {function} options.onError - Callback when error occurs
 * @param {function} options.onData - Callback when data is received
 *
 * @returns {Object} Hook state and controls
 * @property {*} data - Latest parsed sensor data from the SSE stream
 * @property {boolean} isConnected - Current connection status
 * @property {string|null} error - Error message if connection failed
 * @property {function} reconnect - Manual reconnection function
 * @property {number} reconnectAttempt - Current reconnection attempt number
 *
 * @example
 * const { data, isConnected, error, reconnect } = useSensorStream('/api/ruuvi/stream', {
 *   enabled: true,
 *   onConnect: () => console.log('Connected'),
 *   onError: (err) => console.error('Stream error:', err)
 * });
 */
export const useSensorStream = (url, options = {}) => {
  const {
    enabled = true,
    reconnectInterval = 1000,
    maxReconnectInterval = 30000,
    reconnectDecay = 1.5,
    maxReconnectAttempts = Infinity,
    onConnect,
    onDisconnect,
    onError,
    onData,
  } = options

  const [data, setData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

  // Use refs to track mutable state across renders
  const eventSourceRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const currentDelayRef = useRef(reconnectInterval)
  const shouldReconnectRef = useRef(true)

  /**
   * Check if EventSource is supported by the browser
   */
  const isEventSourceSupported = typeof EventSource !== 'undefined'

  /**
   * Cleanup function to close EventSource and clear timeouts
   */
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  /**
   * Connect to the SSE endpoint
   */
  const connect = useCallback(() => {
    // Don't connect if disabled or EventSource not supported
    if (!enabled || !isEventSourceSupported) {
      console.warn('SSE connection disabled or not supported')
      return
    }

    // Cleanup any existing connection
    cleanup()

    try {
      console.log(`Connecting to SSE endpoint: ${url}`)
      // eslint-disable-next-line no-undef
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      /**
       * Handle connection open
       */
      eventSource.onopen = () => {
        console.log('SSE connection established')
        setIsConnected(true)
        setError(null)

        // Reset reconnection attempt counter on successful connection
        reconnectAttemptRef.current = 0
        setReconnectAttempt(0)
        currentDelayRef.current = reconnectInterval

        if (onConnect) {
          onConnect()
        }
      }

      /**
       * Handle incoming messages
       */
      eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data)
          setData(parsedData)

          if (onData) {
            onData(parsedData)
          }
        } catch (err) {
          console.error('Failed to parse SSE data:', err)
          console.error('Raw data:', event.data)
          setError('Failed to parse server data')

          if (onError) {
            onError(err)
          }
        }
      }

      /**
       * Handle connection errors and implement reconnection logic
       */
      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err)
        setIsConnected(false)

        // Close the current connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }

        if (onDisconnect) {
          onDisconnect()
        }

        // Implement exponential backoff for reconnection
        if (
          shouldReconnectRef.current &&
          reconnectAttemptRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptRef.current += 1
          setReconnectAttempt(reconnectAttemptRef.current)

          const delay = Math.min(
            currentDelayRef.current *
              reconnectDecay ** (reconnectAttemptRef.current - 1),
            maxReconnectInterval
          )

          const errorMessage = `Connection lost. Reconnecting in ${Math.round(
            delay / 1000
          )}s (attempt ${reconnectAttemptRef.current}/${
            maxReconnectAttempts === Infinity ? '∞' : maxReconnectAttempts
          })...`
          setError(errorMessage)
          console.log(errorMessage)

          if (onError) {
            onError(err)
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              connect()
            }
          }, delay)
        } else if (reconnectAttemptRef.current >= maxReconnectAttempts) {
          const errorMessage =
            'Maximum reconnection attempts reached. Please refresh the page.'
          setError(errorMessage)
          console.error(errorMessage)

          if (onError) {
            onError(new Error(errorMessage))
          }
        }
      }
    } catch (err) {
      console.error('Failed to create EventSource:', err)
      setError('Failed to establish connection')
      setIsConnected(false)

      if (onError) {
        onError(err)
      }
    }
  }, [
    url,
    enabled,
    isEventSourceSupported,
    reconnectInterval,
    maxReconnectInterval,
    reconnectDecay,
    maxReconnectAttempts,
    onConnect,
    onDisconnect,
    onError,
    onData,
    cleanup,
  ])

  /**
   * Manual reconnection function
   * Resets reconnection attempts and establishes a new connection
   */
  const reconnect = useCallback(() => {
    console.log('Manual reconnection triggered')
    reconnectAttemptRef.current = 0
    setReconnectAttempt(0)
    currentDelayRef.current = reconnectInterval
    shouldReconnectRef.current = true
    cleanup()
    connect()
  }, [connect, cleanup, reconnectInterval])

  /**
   * Effect to establish initial connection and cleanup on unmount
   */
  useEffect(() => {
    if (enabled && isEventSourceSupported) {
      shouldReconnectRef.current = true
      connect()
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      shouldReconnectRef.current = false
      cleanup()
    }
  }, [enabled, connect, cleanup, isEventSourceSupported])

  /**
   * Log warning if EventSource is not supported
   */
  useEffect(() => {
    if (!isEventSourceSupported) {
      console.warn(
        'EventSource is not supported in this browser. SSE functionality will not be available. ' +
          'Consider implementing a polling fallback for older browsers.'
      )
      setError('Real-time updates not supported in this browser')
    }
  }, [isEventSourceSupported])

  return {
    data,
    isConnected,
    error,
    reconnect,
    reconnectAttempt,
    isSupported: isEventSourceSupported,
  }
}

/**
 * Hook with polling fallback for browsers that don't support EventSource
 *
 * @param {string} url - The endpoint URL (SSE endpoint or polling endpoint)
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether the connection should be active (default: true)
 * @param {number} options.pollingInterval - Polling interval in ms (default: 10000)
 * @param {boolean} options.preferSSE - Prefer SSE over polling if available (default: true)
 *
 * @returns {Object} Hook state and controls (same as useSensorStream)
 */
export const useSensorStreamWithFallback = (url, options = {}) => {
  const {
    enabled = true,
    pollingInterval = 10000,
    preferSSE = true,
    ...sseOptions
  } = options

  const [data, setData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)

  const pollingIntervalRef = useRef(null)
  const isEventSourceSupported = typeof EventSource !== 'undefined'
  const useSSE = preferSSE && isEventSourceSupported

  // Use SSE hook if supported and preferred
  const sseResult = useSensorStream(url, {
    ...sseOptions,
    enabled: enabled && useSSE,
    onData: (newData) => {
      setData(newData)
      if (sseOptions.onData) {
        sseOptions.onData(newData)
      }
    },
  })

  /**
   * Polling fallback implementation
   */
  useEffect(() => {
    if (!enabled || useSSE) {
      return undefined
    }

    console.log('Using polling fallback for sensor data')
    setIsConnected(true)

    const fetchData = async () => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const newData = await response.json()
        setData(newData)
        setError(null)
      } catch (err) {
        console.error('Polling error:', err)
        setError('Failed to fetch data')
        setIsConnected(false)
      }
    }

    // Initial fetch
    fetchData()

    // Set up polling
    pollingIntervalRef.current = setInterval(fetchData, pollingInterval)

    // Cleanup function for useEffect
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [enabled, useSSE, url, pollingInterval])

  // Return SSE results if using SSE, otherwise return polling state
  if (useSSE) {
    return sseResult
  }

  return {
    data,
    isConnected,
    error,
    reconnect: () => {
      console.log('Polling mode - no reconnection needed')
    },
    reconnectAttempt: 0,
    isSupported: true,
  }
}

export default useSensorStream
