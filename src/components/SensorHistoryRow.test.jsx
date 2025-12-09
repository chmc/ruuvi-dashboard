import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import SensorHistoryRow from './SensorHistoryRow'
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
  Line: ({ dataKey, stroke }) => (
    <line
      data-testid={`sparkline-line-${dataKey}`}
      data-key={dataKey}
      data-stroke={stroke}
    />
  ),
  YAxis: () => <g data-testid="y-axis" />,
  XAxis: () => <g data-testid="x-axis" />,
  ReferenceLine: () => <line data-testid="reference-line" />,
}))

describe('SensorHistoryRow', () => {
  const mockHistoryData = [
    { timestamp: 1000, temperature: 20, humidity: 45, pressure: 1013 },
    { timestamp: 2000, temperature: 21, humidity: 46, pressure: 1014 },
    { timestamp: 3000, temperature: 22, humidity: 44, pressure: 1012 },
    { timestamp: 4000, temperature: 21.5, humidity: 45, pressure: 1015 },
    { timestamp: 5000, temperature: 23, humidity: 47, pressure: 1013 },
  ]

  const defaultProps = {
    name: 'Living Room',
    mac: 'aa:bb:cc:dd:ee:ff',
    historyData: mockHistoryData,
    selectedMetrics: ['temperature'],
    onSelect: jest.fn(),
    selected: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sensor name display', () => {
    it('should display sensor name', () => {
      renderWithProviders(<SensorHistoryRow {...defaultProps} />)

      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })

    it('should display different sensor names', () => {
      renderWithProviders(<SensorHistoryRow {...defaultProps} name="Outdoor" />)

      expect(screen.getByText('Outdoor')).toBeInTheDocument()
    })
  })

  describe('sparkline display', () => {
    it('should render sparkline component', () => {
      renderWithProviders(<SensorHistoryRow {...defaultProps} />)

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should pass data to sparkline', () => {
      renderWithProviders(<SensorHistoryRow {...defaultProps} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '5')
    })

    it('should handle empty data array', () => {
      renderWithProviders(
        <SensorHistoryRow {...defaultProps} historyData={[]} />
      )

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '0')
    })

    it('should render line for selected metric', () => {
      renderWithProviders(<SensorHistoryRow {...defaultProps} />)

      expect(
        screen.getByTestId('sparkline-line-temperature')
      ).toBeInTheDocument()
    })

    it('should render multiple lines when multiple metrics selected', () => {
      renderWithProviders(
        <SensorHistoryRow
          {...defaultProps}
          selectedMetrics={['temperature', 'humidity']}
        />
      )

      expect(
        screen.getByTestId('sparkline-line-temperature')
      ).toBeInTheDocument()
      expect(screen.getByTestId('sparkline-line-humidity')).toBeInTheDocument()
    })
  })

  describe('current value display', () => {
    it('should display current value with unit for single metric', () => {
      renderWithProviders(<SensorHistoryRow {...defaultProps} />)

      expect(screen.getByText('23°C')).toBeInTheDocument()
    })

    it('should display multiple values on separate lines when multiple metrics selected', () => {
      renderWithProviders(
        <SensorHistoryRow
          {...defaultProps}
          selectedMetrics={['temperature', 'humidity']}
        />
      )

      // Values now displayed on separate lines
      expect(screen.getByText('23°C')).toBeInTheDocument()
      expect(screen.getByText('47%')).toBeInTheDocument()
    })

    it('should display all three values on separate lines when all metrics selected', () => {
      renderWithProviders(
        <SensorHistoryRow
          {...defaultProps}
          selectedMetrics={['temperature', 'humidity', 'pressure']}
        />
      )

      // Values now displayed on separate lines
      expect(screen.getByText('23°C')).toBeInTheDocument()
      expect(screen.getByText('47%')).toBeInTheDocument()
      expect(screen.getByText('1013hPa')).toBeInTheDocument()
    })

    it('should display dash when historyData is empty', () => {
      renderWithProviders(
        <SensorHistoryRow {...defaultProps} historyData={[]} />
      )

      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('should display dash when historyData is null', () => {
      renderWithProviders(
        <SensorHistoryRow {...defaultProps} historyData={null} />
      )

      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })

  describe('click selection', () => {
    it('should call onSelect when row is clicked', () => {
      const onSelect = jest.fn()
      renderWithProviders(
        <SensorHistoryRow {...defaultProps} onSelect={onSelect} />
      )

      const row = screen.getByRole('button')
      fireEvent.click(row)

      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('should pass mac address to onSelect callback', () => {
      const onSelect = jest.fn()
      renderWithProviders(
        <SensorHistoryRow {...defaultProps} onSelect={onSelect} />
      )

      const row = screen.getByRole('button')
      fireEvent.click(row)

      expect(onSelect).toHaveBeenCalledWith('aa:bb:cc:dd:ee:ff')
    })

    it('should not crash when onSelect is not provided', () => {
      renderWithProviders(
        <SensorHistoryRow {...defaultProps} onSelect={undefined} />
      )

      const row = screen.getByRole('button')
      expect(() => fireEvent.click(row)).not.toThrow()
    })
  })

  describe('selected state', () => {
    it('should have visual indicator when selected', () => {
      renderWithProviders(<SensorHistoryRow {...defaultProps} selected />)

      const row = screen.getByRole('button')
      expect(row).toHaveAttribute('data-selected', 'true')
    })

    it('should not have selected indicator when not selected', () => {
      renderWithProviders(
        <SensorHistoryRow {...defaultProps} selected={false} />
      )

      const row = screen.getByRole('button')
      expect(row).toHaveAttribute('data-selected', 'false')
    })

    it('should apply selected styling', () => {
      const { container } = renderWithProviders(
        <SensorHistoryRow {...defaultProps} selected />
      )

      // The selected row should have a different background
      const row = container.querySelector('[data-selected="true"]')
      expect(row).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have button role for clickable row', () => {
      renderWithProviders(<SensorHistoryRow {...defaultProps} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should have accessible name from sensor name', () => {
      renderWithProviders(<SensorHistoryRow {...defaultProps} />)

      const row = screen.getByRole('button')
      expect(row).toHaveAccessibleName(/Living Room/i)
    })
  })
})
