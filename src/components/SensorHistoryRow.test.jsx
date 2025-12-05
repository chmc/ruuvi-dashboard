import { render, screen, fireEvent } from '@testing-library/react'
import SensorHistoryRow from './SensorHistoryRow'

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
      data-testid="sparkline-line"
      data-key={dataKey}
      data-stroke={stroke}
    />
  ),
}))

describe('SensorHistoryRow', () => {
  const mockData = [
    { timestamp: 1000, value: 20 },
    { timestamp: 2000, value: 21 },
    { timestamp: 3000, value: 22 },
    { timestamp: 4000, value: 21.5 },
    { timestamp: 5000, value: 23 },
  ]

  const defaultProps = {
    name: 'Living Room',
    mac: 'aa:bb:cc:dd:ee:ff',
    data: mockData,
    currentValue: 23,
    unit: '°C',
    onSelect: jest.fn(),
    selected: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sensor name display', () => {
    it('should display sensor name', () => {
      render(<SensorHistoryRow {...defaultProps} />)

      expect(screen.getByText('Living Room')).toBeInTheDocument()
    })

    it('should display different sensor names', () => {
      render(<SensorHistoryRow {...defaultProps} name="Outdoor" />)

      expect(screen.getByText('Outdoor')).toBeInTheDocument()
    })
  })

  describe('sparkline display', () => {
    it('should render sparkline component', () => {
      render(<SensorHistoryRow {...defaultProps} />)

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should pass data to sparkline', () => {
      render(<SensorHistoryRow {...defaultProps} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '5')
    })

    it('should handle empty data array', () => {
      render(<SensorHistoryRow {...defaultProps} data={[]} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '0')
    })
  })

  describe('current value display', () => {
    it('should display current value with unit', () => {
      render(<SensorHistoryRow {...defaultProps} />)

      expect(screen.getByText('23°C')).toBeInTheDocument()
    })

    it('should display value with different unit', () => {
      render(<SensorHistoryRow {...defaultProps} currentValue={65} unit="%" />)

      expect(screen.getByText('65%')).toBeInTheDocument()
    })

    it('should display decimal values', () => {
      render(<SensorHistoryRow {...defaultProps} currentValue={22.5} />)

      expect(screen.getByText('22.5°C')).toBeInTheDocument()
    })

    it('should display dash when current value is null', () => {
      render(<SensorHistoryRow {...defaultProps} currentValue={null} />)

      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('should display dash when current value is undefined', () => {
      render(<SensorHistoryRow {...defaultProps} currentValue={undefined} />)

      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })

  describe('click selection', () => {
    it('should call onSelect when row is clicked', () => {
      const onSelect = jest.fn()
      render(<SensorHistoryRow {...defaultProps} onSelect={onSelect} />)

      const row = screen.getByRole('button')
      fireEvent.click(row)

      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('should pass mac address to onSelect callback', () => {
      const onSelect = jest.fn()
      render(<SensorHistoryRow {...defaultProps} onSelect={onSelect} />)

      const row = screen.getByRole('button')
      fireEvent.click(row)

      expect(onSelect).toHaveBeenCalledWith('aa:bb:cc:dd:ee:ff')
    })

    it('should not crash when onSelect is not provided', () => {
      render(<SensorHistoryRow {...defaultProps} onSelect={undefined} />)

      const row = screen.getByRole('button')
      expect(() => fireEvent.click(row)).not.toThrow()
    })
  })

  describe('selected state', () => {
    it('should have visual indicator when selected', () => {
      render(<SensorHistoryRow {...defaultProps} selected />)

      const row = screen.getByRole('button')
      expect(row).toHaveAttribute('data-selected', 'true')
    })

    it('should not have selected indicator when not selected', () => {
      render(<SensorHistoryRow {...defaultProps} selected={false} />)

      const row = screen.getByRole('button')
      expect(row).toHaveAttribute('data-selected', 'false')
    })

    it('should apply selected styling', () => {
      const { container } = render(
        <SensorHistoryRow {...defaultProps} selected />
      )

      // The selected row should have a different background
      const row = container.querySelector('[data-selected="true"]')
      expect(row).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have button role for clickable row', () => {
      render(<SensorHistoryRow {...defaultProps} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should have accessible name from sensor name', () => {
      render(<SensorHistoryRow {...defaultProps} />)

      const row = screen.getByRole('button')
      expect(row).toHaveAccessibleName(/Living Room/i)
    })
  })
})
