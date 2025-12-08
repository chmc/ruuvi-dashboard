/**
 * Chart formatting utilities for consistent time and value display
 * across all chart components (DetailChart, Sparkline, etc.)
 */

/**
 * Format timestamp for X axis based on time range
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {string} [timeRange] - Time range (1h, 6h, 24h, 7d, 30d, all)
 * @returns {string} Formatted time string
 */
export const formatXAxisTime = (timestamp, timeRange) => {
  const date = new Date(timestamp)

  // For shorter ranges, show time only
  if (timeRange === '1h' || timeRange === '6h' || timeRange === '24h') {
    return date.toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // For 7d, show weekday and day
  if (timeRange === '7d') {
    return date.toLocaleDateString('fi-FI', {
      weekday: 'short',
      day: 'numeric',
    })
  }

  // For 30d, all, and default - show day and month
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
}

/**
 * Format timestamp for tooltip label
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date/time string
 */
export const formatTooltipLabel = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('fi-FI', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format value for tooltip display
 * @param {number} value - The metric value
 * @param {string} unit - The unit string
 * @returns {string} Formatted value with unit
 */
export const formatTooltipValue = (value, unit) => {
  if (value === null || value === undefined) return '-'
  const formatted = typeof value === 'number' ? value.toFixed(1) : value
  return `${formatted}${unit}`
}

/**
 * Format value for Y axis display (rounded to integer)
 * @param {number} value - The metric value
 * @returns {string} Formatted value
 */
export const formatYAxisValue = (value) => {
  if (value === null || value === undefined) return ''
  return typeof value === 'number' ? Math.round(value).toString() : value
}

/**
 * Get number of X-axis ticks based on time range
 * @param {string} timeRange - Time range (1h, 6h, 24h, 7d, 30d, all)
 * @returns {number} Number of ticks to display
 */
export const getXAxisTickCount = (timeRange) => {
  switch (timeRange) {
    case '1h':
      return 4 // Every 15 minutes
    case '6h':
      return 6 // Every hour
    case '24h':
      return 6 // Every 4 hours
    case '7d':
      return 7 // Every day
    case '30d':
      return 6 // Every 5 days
    default:
      return 5 // Default for 'all' and unknown
  }
}
