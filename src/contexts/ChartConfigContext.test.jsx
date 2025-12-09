import { render, screen } from '@testing-library/react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import {
  ChartConfigProvider,
  useChartConfig,
  DEFAULT_CHART_CONFIG,
} from './ChartConfigContext'

// Test consumer component
const TestConsumer = () => {
  const chartConfig = useChartConfig()
  return (
    <div>
      <span data-testid="grid-color">{chartConfig.grid.color}</span>
      <span data-testid="axis-color">{chartConfig.axis.color}</span>
      <span data-testid="axis-tick-color">{chartConfig.axis.tickColor}</span>
      <span data-testid="tooltip-bg">
        {chartConfig.tooltip.backgroundColor}
      </span>
      <span data-testid="tooltip-border">
        {chartConfig.tooltip.borderColor}
      </span>
      <span data-testid="reference-line-color">
        {chartConfig.referenceLine.color}
      </span>
      <span data-testid="temp-color">{chartConfig.metrics.temperature}</span>
      <span data-testid="humidity-color">{chartConfig.metrics.humidity}</span>
      <span data-testid="pressure-color">{chartConfig.metrics.pressure}</span>
    </div>
  )
}

describe('ChartConfigContext', () => {
  describe('DEFAULT_CHART_CONFIG', () => {
    it('should export default chart configuration', () => {
      expect(DEFAULT_CHART_CONFIG).toBeDefined()
      expect(DEFAULT_CHART_CONFIG.grid).toBeDefined()
      expect(DEFAULT_CHART_CONFIG.axis).toBeDefined()
      expect(DEFAULT_CHART_CONFIG.tooltip).toBeDefined()
      expect(DEFAULT_CHART_CONFIG.referenceLine).toBeDefined()
      expect(DEFAULT_CHART_CONFIG.metrics).toBeDefined()
    })

    it('should have grid configuration', () => {
      expect(DEFAULT_CHART_CONFIG.grid.color).toBe('rgba(255, 255, 255, 0.1)')
      expect(DEFAULT_CHART_CONFIG.grid.strokeDasharray).toBe('3 3')
    })

    it('should have axis configuration', () => {
      expect(DEFAULT_CHART_CONFIG.axis.color).toBe('rgba(255, 255, 255, 0.5)')
      expect(DEFAULT_CHART_CONFIG.axis.tickColor).toBe(
        'rgba(255, 255, 255, 0.7)'
      )
      expect(DEFAULT_CHART_CONFIG.axis.tickFontSize).toBe(12)
    })

    it('should have tooltip configuration', () => {
      expect(DEFAULT_CHART_CONFIG.tooltip.backgroundColor).toBe(
        'rgba(30, 30, 30, 0.95)'
      )
      expect(DEFAULT_CHART_CONFIG.tooltip.borderColor).toBe(
        'rgba(255, 255, 255, 0.2)'
      )
      expect(DEFAULT_CHART_CONFIG.tooltip.borderRadius).toBe(4)
    })

    it('should have reference line configuration', () => {
      expect(DEFAULT_CHART_CONFIG.referenceLine.color).toBe('#444')
      expect(DEFAULT_CHART_CONFIG.referenceLine.strokeDasharray).toBe('3 3')
    })

    it('should have metric colors', () => {
      expect(DEFAULT_CHART_CONFIG.metrics.temperature).toBe('#ff7043')
      expect(DEFAULT_CHART_CONFIG.metrics.humidity).toBe('#42a5f5')
      expect(DEFAULT_CHART_CONFIG.metrics.pressure).toBe('#66bb6a')
    })
  })

  describe('ChartConfigProvider', () => {
    it('should provide default configuration without theme override', () => {
      const theme = createTheme({ palette: { mode: 'dark' } })

      render(
        <ThemeProvider theme={theme}>
          <ChartConfigProvider>
            <TestConsumer />
          </ChartConfigProvider>
        </ThemeProvider>
      )

      expect(screen.getByTestId('grid-color')).toHaveTextContent(
        'rgba(255, 255, 255, 0.1)'
      )
      expect(screen.getByTestId('axis-color')).toHaveTextContent(
        'rgba(255, 255, 255, 0.5)'
      )
      expect(screen.getByTestId('temp-color')).toHaveTextContent('#ff7043')
    })

    it('should merge theme overrides with defaults', () => {
      const theme = createTheme({
        palette: {
          mode: 'dark',
        },
        chartConfig: {
          grid: {
            color: 'rgba(0, 0, 0, 0.2)',
          },
          metrics: {
            temperature: '#ff0000',
          },
        },
      })

      render(
        <ThemeProvider theme={theme}>
          <ChartConfigProvider>
            <TestConsumer />
          </ChartConfigProvider>
        </ThemeProvider>
      )

      // Overridden values
      expect(screen.getByTestId('grid-color')).toHaveTextContent(
        'rgba(0, 0, 0, 0.2)'
      )
      expect(screen.getByTestId('temp-color')).toHaveTextContent('#ff0000')

      // Default values should still be present
      expect(screen.getByTestId('axis-color')).toHaveTextContent(
        'rgba(255, 255, 255, 0.5)'
      )
      expect(screen.getByTestId('humidity-color')).toHaveTextContent('#42a5f5')
    })

    it('should allow complete theme override', () => {
      const customConfig = {
        grid: {
          color: 'custom-grid',
          strokeDasharray: '5 5',
        },
        axis: {
          color: 'custom-axis',
          tickColor: 'custom-tick',
          tickFontSize: 14,
        },
        tooltip: {
          backgroundColor: 'custom-bg',
          borderColor: 'custom-border',
          borderRadius: 8,
        },
        referenceLine: {
          color: 'custom-ref',
          strokeDasharray: '2 2',
        },
        metrics: {
          temperature: 'custom-temp',
          humidity: 'custom-humidity',
          pressure: 'custom-pressure',
        },
      }

      const theme = createTheme({
        palette: { mode: 'dark' },
        chartConfig: customConfig,
      })

      render(
        <ThemeProvider theme={theme}>
          <ChartConfigProvider>
            <TestConsumer />
          </ChartConfigProvider>
        </ThemeProvider>
      )

      expect(screen.getByTestId('grid-color')).toHaveTextContent('custom-grid')
      expect(screen.getByTestId('axis-color')).toHaveTextContent('custom-axis')
      expect(screen.getByTestId('tooltip-bg')).toHaveTextContent('custom-bg')
      expect(screen.getByTestId('reference-line-color')).toHaveTextContent(
        'custom-ref'
      )
      expect(screen.getByTestId('temp-color')).toHaveTextContent('custom-temp')
    })
  })

  describe('useChartConfig', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      expect(() => {
        render(<TestConsumer />)
      }).toThrow('useChartConfig must be used within a ChartConfigProvider')

      consoleSpy.mockRestore()
    })

    it('should return chart config when used inside provider', () => {
      const theme = createTheme({ palette: { mode: 'dark' } })

      render(
        <ThemeProvider theme={theme}>
          <ChartConfigProvider>
            <TestConsumer />
          </ChartConfigProvider>
        </ThemeProvider>
      )

      // All values should be defined
      expect(screen.getByTestId('grid-color').textContent).toBeTruthy()
      expect(screen.getByTestId('axis-color').textContent).toBeTruthy()
      expect(screen.getByTestId('tooltip-bg').textContent).toBeTruthy()
      expect(
        screen.getByTestId('reference-line-color').textContent
      ).toBeTruthy()
      expect(screen.getByTestId('temp-color').textContent).toBeTruthy()
    })
  })
})
