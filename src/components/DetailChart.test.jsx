import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import DetailChart from './DetailChart'
import { ChartConfigProvider } from '../contexts/ChartConfigContext'

// Wrapper component to provide required context
const theme = createTheme({ palette: { mode: 'dark' } })

const renderWithProviders = (ui) =>
  render(
    <ThemeProvider theme={theme}>
      <ChartConfigProvider>{ui}</ChartConfigProvider>
    </ThemeProvider>
  )

// Mock recharts components since they don't render properly in jsdom
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }) => (
    <svg data-testid="line-chart" data-points={data?.length || 0}>
      {children}
    </svg>
  ),
  Line: ({ dataKey, stroke, name, yAxisId }) => (
    <line
      data-testid={`chart-line-${dataKey}`}
      data-key={dataKey}
      data-stroke={stroke}
      data-name={name}
      data-yaxis={yAxisId}
    />
  ),
  XAxis: ({ dataKey, tickFormatter }) => (
    <g
      data-testid="x-axis"
      data-key={dataKey}
      data-has-formatter={!!tickFormatter}
    />
  ),
  YAxis: ({ yAxisId, orientation, domain, tickFormatter }) => (
    <g
      data-testid={`y-axis${yAxisId ? `-${yAxisId}` : ''}`}
      data-orientation={orientation}
      data-domain={JSON.stringify(domain)}
      data-has-formatter={!!tickFormatter}
    />
  ),
  Tooltip: ({ formatter, labelFormatter }) => (
    <div
      data-testid="chart-tooltip"
      data-has-formatter={!!formatter}
      data-has-label-formatter={!!labelFormatter}
    />
  ),
  CartesianGrid: () => <g data-testid="cartesian-grid" />,
  Legend: ({ payload }) => (
    <div data-testid="chart-legend">
      {payload?.map((entry) => (
        <span key={entry.value}>{entry.value}</span>
      ))}
    </div>
  ),
}))

describe('DetailChart', () => {
  const mockTemperatureData = [
    {
      timestamp: 1700000000000,
      temperature: 20.5,
      humidity: 45,
      pressure: 1013,
    },
    {
      timestamp: 1700003600000,
      temperature: 21.0,
      humidity: 46,
      pressure: 1014,
    },
    {
      timestamp: 1700007200000,
      temperature: 21.5,
      humidity: 44,
      pressure: 1012,
    },
    {
      timestamp: 1700010800000,
      temperature: 22.0,
      humidity: 43,
      pressure: 1015,
    },
    {
      timestamp: 1700014400000,
      temperature: 21.8,
      humidity: 45,
      pressure: 1013,
    },
  ]

  const defaultProps = {
    data: mockTemperatureData,
    sensorName: 'Living Room',
  }

  describe('chart rendering with temperature data', () => {
    it('should render chart container', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should render LineChart with data', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toBeInTheDocument()
      expect(chart).toHaveAttribute('data-points', '5')
    })

    it('should render temperature line by default', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('chart-line-temperature')).toBeInTheDocument()
    })

    it('should display sensor name in title', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
  })

  describe('time axis (X)', () => {
    it('should render X axis', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    })

    it('should use timestamp as X axis data key', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      const xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('data-key', 'timestamp')
    })

    it('should have time formatter for X axis', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      const xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('data-has-formatter', 'true')
    })
  })

  describe('value axis (Y)', () => {
    it('should render Y axis for temperature by default', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('y-axis-temperature')).toBeInTheDocument()
    })

    it('should have value formatter for Y axis', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      const yAxis = screen.getByTestId('y-axis-temperature')
      expect(yAxis).toHaveAttribute('data-has-formatter', 'true')
    })
  })

  describe('tooltip', () => {
    it('should render tooltip component', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument()
    })

    it('should have value formatter for tooltip', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      const tooltip = screen.getByTestId('chart-tooltip')
      expect(tooltip).toHaveAttribute('data-has-formatter', 'true')
    })

    it('should have label formatter for tooltip timestamp', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      const tooltip = screen.getByTestId('chart-tooltip')
      expect(tooltip).toHaveAttribute('data-has-label-formatter', 'true')
    })
  })

  describe('metric selection via props', () => {
    it('should render temperature line by default', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('chart-line-temperature')).toBeInTheDocument()
    })

    it('should render line for specified metric in props', () => {
      renderWithProviders(
        <DetailChart {...defaultProps} selectedMetrics={['humidity']} />
      )

      expect(screen.getByTestId('chart-line-humidity')).toBeInTheDocument()
      expect(
        screen.queryByTestId('chart-line-temperature')
      ).not.toBeInTheDocument()
    })

    it('should render lines for all metrics when multiple specified', () => {
      renderWithProviders(
        <DetailChart
          {...defaultProps}
          selectedMetrics={['temperature', 'humidity']}
        />
      )

      expect(screen.getByTestId('chart-line-temperature')).toBeInTheDocument()
      expect(screen.getByTestId('chart-line-humidity')).toBeInTheDocument()
    })

    it('should render three lines when all metrics specified', () => {
      renderWithProviders(
        <DetailChart
          {...defaultProps}
          selectedMetrics={['temperature', 'humidity', 'pressure']}
        />
      )

      expect(screen.getByTestId('chart-line-temperature')).toBeInTheDocument()
      expect(screen.getByTestId('chart-line-humidity')).toBeInTheDocument()
      expect(screen.getByTestId('chart-line-pressure')).toBeInTheDocument()
    })

    it('should render multiple Y-axes for different metric types', () => {
      renderWithProviders(
        <DetailChart
          {...defaultProps}
          selectedMetrics={['temperature', 'humidity']}
        />
      )

      expect(screen.getByTestId('y-axis-temperature')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis-humidity')).toBeInTheDocument()
    })

    it('should place secondary Y-axis on right side', () => {
      renderWithProviders(
        <DetailChart
          {...defaultProps}
          selectedMetrics={['temperature', 'humidity']}
        />
      )

      const humidityAxis = screen.getByTestId('y-axis-humidity')
      expect(humidityAxis).toHaveAttribute('data-orientation', 'right')
    })
  })

  describe('time range handling', () => {
    it('should handle short time range (1h) data', () => {
      const shortRangeData = [
        {
          timestamp: 1700000000000,
          temperature: 20.5,
          humidity: 45,
          pressure: 1013,
        },
        {
          timestamp: 1700001800000,
          temperature: 20.7,
          humidity: 45,
          pressure: 1013,
        },
        {
          timestamp: 1700003600000,
          temperature: 21.0,
          humidity: 46,
          pressure: 1014,
        },
      ]
      renderWithProviders(
        <DetailChart {...defaultProps} data={shortRangeData} timeRange="1h" />
      )

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '3')
    })

    it('should handle long time range (30d) data', () => {
      const longRangeData = Array.from({ length: 30 }, (_, i) => ({
        timestamp: 1700000000000 + i * 86400000,
        temperature: 20 + Math.random() * 5,
        humidity: 40 + Math.random() * 20,
        pressure: 1010 + Math.random() * 10,
      }))
      renderWithProviders(
        <DetailChart {...defaultProps} data={longRangeData} timeRange="30d" />
      )

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '30')
    })

    it('should handle empty data gracefully', () => {
      renderWithProviders(<DetailChart {...defaultProps} data={[]} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '0')
    })

    it('should handle null data gracefully', () => {
      renderWithProviders(<DetailChart {...defaultProps} data={null} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '0')
    })
  })

  describe('responsive sizing', () => {
    it('should use ResponsiveContainer for chart', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should apply custom height when provided', () => {
      const { container } = renderWithProviders(
        <DetailChart {...defaultProps} height={300} />
      )

      const chartWrapper = container.querySelector(
        '[data-testid="detail-chart-wrapper"]'
      )
      expect(chartWrapper).toHaveStyle({ height: '300px' })
    })

    it('should use default height when not provided', () => {
      const { container } = renderWithProviders(
        <DetailChart {...defaultProps} />
      )

      const chartWrapper = container.querySelector(
        '[data-testid="detail-chart-wrapper"]'
      )
      expect(chartWrapper).toHaveStyle({ height: '250px' })
    })
  })

  describe('grid lines', () => {
    it('should render cartesian grid', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    })
  })

  describe('multi-sensor support', () => {
    const multiSensorData = {
      sensor1: [
        {
          timestamp: 1700000000000,
          temperature: 20.5,
          humidity: 45,
          pressure: 1013,
        },
        {
          timestamp: 1700003600000,
          temperature: 21.0,
          humidity: 46,
          pressure: 1014,
        },
      ],
      sensor2: [
        {
          timestamp: 1700000000000,
          temperature: 18.0,
          humidity: 55,
          pressure: 1010,
        },
        {
          timestamp: 1700003600000,
          temperature: 17.5,
          humidity: 58,
          pressure: 1011,
        },
      ],
    }

    const sensorConfigs = [
      { mac: 'sensor1', name: 'Living Room', color: '#ff7043' },
      { mac: 'sensor2', name: 'Bedroom', color: '#42a5f5' },
    ]

    it('should render multiple lines when given multi-sensor data', () => {
      renderWithProviders(
        <DetailChart
          multiSensorData={multiSensorData}
          sensorConfigs={sensorConfigs}
        />
      )

      expect(
        screen.getByTestId('chart-line-temperature-sensor1')
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('chart-line-temperature-sensor2')
      ).toBeInTheDocument()
    })

    it('should render legend when multiple sensors are displayed', () => {
      renderWithProviders(
        <DetailChart
          multiSensorData={multiSensorData}
          sensorConfigs={sensorConfigs}
        />
      )

      expect(screen.getByTestId('chart-legend')).toBeInTheDocument()
    })

    it('should show sensor names in legend', () => {
      renderWithProviders(
        <DetailChart
          multiSensorData={multiSensorData}
          sensorConfigs={sensorConfigs}
        />
      )

      // In multi-sensor mode with temperature selected, legend shows "SensorName - Temperature"
      expect(screen.getByText('Living Room - Temperature')).toBeInTheDocument()
      expect(screen.getByText('Bedroom - Temperature')).toBeInTheDocument()
    })

    it('should use sensor-specific colors for each line', () => {
      renderWithProviders(
        <DetailChart
          multiSensorData={multiSensorData}
          sensorConfigs={sensorConfigs}
        />
      )

      const line1 = screen.getByTestId('chart-line-temperature-sensor1')
      const line2 = screen.getByTestId('chart-line-temperature-sensor2')

      expect(line1).toHaveAttribute('data-stroke', '#ff7043')
      expect(line2).toHaveAttribute('data-stroke', '#42a5f5')
    })

    it('should show humidity lines for all sensors when humidity is selected', () => {
      renderWithProviders(
        <DetailChart
          multiSensorData={multiSensorData}
          sensorConfigs={sensorConfigs}
          selectedMetrics={['humidity']}
        />
      )

      expect(
        screen.getByTestId('chart-line-humidity-sensor1')
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('chart-line-humidity-sensor2')
      ).toBeInTheDocument()
    })

    it('should merge data points by timestamp for aligned display', () => {
      renderWithProviders(
        <DetailChart
          multiSensorData={multiSensorData}
          sensorConfigs={sensorConfigs}
        />
      )

      const chart = screen.getByTestId('line-chart')
      // Should have 2 merged data points (timestamps are aligned)
      expect(chart).toHaveAttribute('data-points', '2')
    })

    it('should display title indicating comparison mode', () => {
      renderWithProviders(
        <DetailChart
          multiSensorData={multiSensorData}
          sensorConfigs={sensorConfigs}
        />
      )

      expect(screen.getByText(/comparison/i)).toBeInTheDocument()
    })

    it('should fall back to single sensor mode when only data prop is provided', () => {
      renderWithProviders(<DetailChart {...defaultProps} />)

      // Should still work with original single-sensor API
      expect(screen.getByTestId('chart-line-temperature')).toBeInTheDocument()
      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
  })
})
