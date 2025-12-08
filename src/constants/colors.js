/**
 * Default colors for sensors in multi-sensor chart views.
 * Each sensor is assigned a distinct color based on its index.
 * @type {string[]}
 */
export const SENSOR_COLORS = [
  '#ff7043', // Deep Orange
  '#42a5f5', // Blue
  '#66bb6a', // Green
  '#ab47bc', // Purple
  '#ffa726', // Orange
  '#26c6da', // Cyan
  '#ec407a', // Pink
  '#8d6e63', // Brown
]

/**
 * Default fallback color for sensors when index is invalid
 * @type {string}
 */
export const DEFAULT_SENSOR_COLOR = '#888888'

/**
 * Get sensor color by index with wraparound support.
 * Returns colors from SENSOR_COLORS array, wrapping around when
 * index exceeds array length.
 *
 * @param {number} index - Sensor index (0-based)
 * @returns {string} Hex color code
 */
export const getSensorColor = (index) => {
  if (
    index === null ||
    index === undefined ||
    typeof index !== 'number' ||
    Number.isNaN(index) ||
    index < 0
  ) {
    return DEFAULT_SENSOR_COLOR
  }
  const flooredIndex = Math.floor(index)
  return SENSOR_COLORS[flooredIndex % SENSOR_COLORS.length]
}
