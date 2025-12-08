/**
 * @typedef {Object} TimeRangeConfig
 * @property {string} value - Time range value (e.g., '1h', '24h', '7d')
 * @property {string} label - Display label (e.g., '1h', '24h', 'All')
 */

/**
 * Available time range options for history data
 * @type {TimeRangeConfig[]}
 */
export const TIME_RANGES = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'all', label: 'All' },
]

/**
 * Array of time range values for iteration and validation
 * @type {string[]}
 */
export const TIME_RANGE_VALUES = TIME_RANGES.map((r) => r.value)

/**
 * Default time range selection
 * @type {string}
 */
export const DEFAULT_TIME_RANGE = '24h'

/**
 * Get time range label by value
 * @param {string} value - Time range value
 * @returns {string} Display label or empty string if not found
 */
export const getTimeRangeLabel = (value) => {
  if (value === null || value === undefined) return ''
  const range = TIME_RANGES.find((r) => r.value === value)
  return range?.label ?? ''
}

/**
 * Get full time range configuration by value
 * @param {string} value - Time range value
 * @returns {TimeRangeConfig|undefined} Time range configuration or undefined if not found
 */
export const getTimeRangeByValue = (value) =>
  TIME_RANGES.find((r) => r.value === value)

/**
 * Check if a value is a valid time range
 * @param {string} value - Value to check
 * @returns {boolean} True if valid time range
 */
export const isValidTimeRange = (value) => TIME_RANGE_VALUES.includes(value)
