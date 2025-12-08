/**
 * @typedef {Object} MetricConfig
 * @property {string} key - Metric identifier (e.g., 'temperature')
 * @property {string} label - Display label (e.g., 'Temperature')
 * @property {string} unit - Unit string (e.g., '°C')
 * @property {string} color - Hex color code for charts
 */

/**
 * Array of metric configurations
 * @type {MetricConfig[]}
 */
export const METRICS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#ff7043' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#42a5f5' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#66bb6a' },
]

/**
 * Metrics indexed by key for O(1) lookup
 * @type {Object<string, {color: string, unit: string, label: string}>}
 */
export const METRICS_BY_KEY = METRICS.reduce(
  (result, metric) => ({
    ...result,
    [metric.key]: {
      color: metric.color,
      unit: metric.unit,
      label: metric.label,
    },
  }),
  {}
)

/**
 * Array of metric keys for iteration
 * @type {string[]}
 */
export const METRIC_KEYS = METRICS.map((m) => m.key)

/**
 * Default fallback color for unknown metrics
 */
const DEFAULT_COLOR = '#888'

/**
 * Get full metric configuration by key
 * @param {string} key - Metric key
 * @returns {MetricConfig|undefined} Metric configuration or undefined if not found
 */
export const getMetricByKey = (key) => METRICS.find((m) => m.key === key)

/**
 * Get metric color by key
 * @param {string} key - Metric key
 * @returns {string} Hex color code or default fallback
 */
export const getMetricColor = (key) =>
  METRICS_BY_KEY[key]?.color ?? DEFAULT_COLOR

/**
 * Get metric unit by key
 * @param {string} key - Metric key
 * @returns {string} Unit string or empty string if not found
 */
export const getMetricUnit = (key) => METRICS_BY_KEY[key]?.unit ?? ''

/**
 * Get metric label by key
 * @param {string} key - Metric key
 * @returns {string} Display label, the key as fallback, or empty string for null/undefined
 */
export const getMetricLabel = (key) => {
  if (key === null || key === undefined) return ''
  return METRICS_BY_KEY[key]?.label ?? key
}
