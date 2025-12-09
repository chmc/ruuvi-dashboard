import { createContext, useContext, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'

/**
 * @typedef {Object} GridConfig
 * @property {string} color - Grid line color
 * @property {string} strokeDasharray - Grid dash pattern
 */

/**
 * @typedef {Object} AxisConfig
 * @property {string} color - Axis line color
 * @property {string} tickColor - Axis tick label color
 * @property {number} tickFontSize - Axis tick font size
 */

/**
 * @typedef {Object} TooltipConfig
 * @property {string} backgroundColor - Tooltip background color
 * @property {string} borderColor - Tooltip border color
 * @property {number} borderRadius - Tooltip border radius
 */

/**
 * @typedef {Object} ReferenceLineConfig
 * @property {string} color - Reference line color
 * @property {string} strokeDasharray - Reference line dash pattern
 */

/**
 * @typedef {Object} MetricColors
 * @property {string} temperature - Temperature metric color
 * @property {string} humidity - Humidity metric color
 * @property {string} pressure - Pressure metric color
 */

/**
 * @typedef {Object} ChartConfig
 * @property {GridConfig} grid - Grid configuration
 * @property {AxisConfig} axis - Axis configuration
 * @property {TooltipConfig} tooltip - Tooltip configuration
 * @property {ReferenceLineConfig} referenceLine - Reference line configuration
 * @property {MetricColors} metrics - Metric color configuration
 */

/**
 * Default chart configuration for dark theme
 * @type {ChartConfig}
 */
export const DEFAULT_CHART_CONFIG = {
  grid: {
    color: 'rgba(255, 255, 255, 0.1)',
    strokeDasharray: '3 3',
  },
  axis: {
    color: 'rgba(255, 255, 255, 0.5)',
    tickColor: 'rgba(255, 255, 255, 0.7)',
    tickFontSize: 12,
  },
  tooltip: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  referenceLine: {
    color: '#444',
    strokeDasharray: '3 3',
  },
  metrics: {
    temperature: '#ff7043',
    humidity: '#42a5f5',
    pressure: '#66bb6a',
  },
}

/**
 * Deep merge two objects, with source values overriding target values
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
const deepMerge = (target, source) => {
  const result = { ...target }

  Object.keys(source).forEach((key) => {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  })

  return result
}

/**
 * Context for chart configuration
 * @type {React.Context<ChartConfig|null>}
 */
const ChartConfigContext = createContext(null)

/**
 * Provider component for chart configuration
 * Merges theme.chartConfig with defaults to provide theme-aware chart colors
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element}
 */
export const ChartConfigProvider = ({ children }) => {
  const theme = useTheme()

  const chartConfig = useMemo(() => {
    const themeConfig = theme.chartConfig || {}
    return deepMerge(DEFAULT_CHART_CONFIG, themeConfig)
  }, [theme.chartConfig])

  return (
    <ChartConfigContext.Provider value={chartConfig}>
      {children}
    </ChartConfigContext.Provider>
  )
}

/**
 * Hook to access chart configuration
 * Must be used within a ChartConfigProvider
 *
 * @returns {ChartConfig} Chart configuration object
 * @throws {Error} If used outside ChartConfigProvider
 */
export const useChartConfig = () => {
  const context = useContext(ChartConfigContext)

  if (context === null) {
    throw new Error('useChartConfig must be used within a ChartConfigProvider')
  }

  return context
}

export default ChartConfigContext
