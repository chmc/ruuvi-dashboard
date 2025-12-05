import { render, screen, fireEvent } from '@testing-library/react'
import DetailChart from './DetailChart'

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
  Line: ({ dataKey, stroke, name }) => (
    <line
      data-testid={`chart-line-${dataKey}`}
      data-key={dataKey}
      data-stroke={stroke}
      data-name={name}
    />
  ),
  XAxis: ({ dataKey, tickFormatter }) => (
    <g
      data-testid="x-axis"
      data-key={dataKey}
      data-has-formatter={!!tickFormatter}
    />
  ),
  YAxis: ({ domain, tickFormatter }) => (
    <g
      data-testid="y-axis"
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
      render(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should render LineChart with data', () => {
      render(<DetailChart {...defaultProps} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toBeInTheDocument()
      expect(chart).toHaveAttribute('data-points', '5')
    })

    it('should render temperature line by default', () => {
      render(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('chart-line-temperature')).toBeInTheDocument()
    })

    it('should display sensor name in title', () => {
      render(<DetailChart {...defaultProps} />)

      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })
  })

  describe('time axis (X)', () => {
    it('should render X axis', () => {
      render(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    })

    it('should use timestamp as X axis data key', () => {
      render(<DetailChart {...defaultProps} />)

      const xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('data-key', 'timestamp')
    })

    it('should have time formatter for X axis', () => {
      render(<DetailChart {...defaultProps} />)

      const xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('data-has-formatter', 'true')
    })
  })

  describe('value axis (Y)', () => {
    it('should render Y axis', () => {
      render(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    })

    it('should have value formatter for Y axis', () => {
      render(<DetailChart {...defaultProps} />)

      const yAxis = screen.getByTestId('y-axis')
      expect(yAxis).toHaveAttribute('data-has-formatter', 'true')
    })
  })

  describe('tooltip', () => {
    it('should render tooltip component', () => {
      render(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument()
    })

    it('should have value formatter for tooltip', () => {
      render(<DetailChart {...defaultProps} />)

      const tooltip = screen.getByTestId('chart-tooltip')
      expect(tooltip).toHaveAttribute('data-has-formatter', 'true')
    })

    it('should have label formatter for tooltip timestamp', () => {
      render(<DetailChart {...defaultProps} />)

      const tooltip = screen.getByTestId('chart-tooltip')
      expect(tooltip).toHaveAttribute('data-has-label-formatter', 'true')
    })
  })

  describe('metric tabs', () => {
    it('should render metric tabs', () => {
      render(<DetailChart {...defaultProps} />)

      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('should render temperature tab', () => {
      render(<DetailChart {...defaultProps} />)

      expect(
        screen.getByRole('tab', { name: /temperature/i })
      ).toBeInTheDocument()
    })

    it('should render humidity tab', () => {
      render(<DetailChart {...defaultProps} />)

      expect(screen.getByRole('tab', { name: /humidity/i })).toBeInTheDocument()
    })

    it('should render pressure tab', () => {
      render(<DetailChart {...defaultProps} />)

      expect(screen.getByRole('tab', { name: /pressure/i })).toBeInTheDocument()
    })

    it('should have temperature tab selected by default', () => {
      render(<DetailChart {...defaultProps} />)

      const tempTab = screen.getByRole('tab', { name: /temperature/i })
      expect(tempTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should switch to humidity when humidity tab is clicked', () => {
      render(<DetailChart {...defaultProps} />)

      const humidityTab = screen.getByRole('tab', { name: /humidity/i })
      fireEvent.click(humidityTab)

      expect(humidityTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByTestId('chart-line-humidity')).toBeInTheDocument()
    })

    it('should switch to pressure when pressure tab is clicked', () => {
      render(<DetailChart {...defaultProps} />)

      const pressureTab = screen.getByRole('tab', { name: /pressure/i })
      fireEvent.click(pressureTab)

      expect(pressureTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByTestId('chart-line-pressure')).toBeInTheDocument()
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
      render(
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
      render(
        <DetailChart {...defaultProps} data={longRangeData} timeRange="30d" />
      )

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '30')
    })

    it('should handle empty data gracefully', () => {
      render(<DetailChart {...defaultProps} data={[]} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '0')
    })

    it('should handle null data gracefully', () => {
      render(<DetailChart {...defaultProps} data={null} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '0')
    })
  })

  describe('responsive sizing', () => {
    it('should use ResponsiveContainer for chart', () => {
      render(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should apply custom height when provided', () => {
      const { container } = render(
        <DetailChart {...defaultProps} height={300} />
      )

      const chartWrapper = container.querySelector(
        '[data-testid="detail-chart-wrapper"]'
      )
      expect(chartWrapper).toHaveStyle({ height: '300px' })
    })

    it('should use default height when not provided', () => {
      const { container } = render(<DetailChart {...defaultProps} />)

      const chartWrapper = container.querySelector(
        '[data-testid="detail-chart-wrapper"]'
      )
      expect(chartWrapper).toHaveStyle({ height: '250px' })
    })
  })

  describe('grid lines', () => {
    it('should render cartesian grid', () => {
      render(<DetailChart {...defaultProps} />)

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    })
  })
})
