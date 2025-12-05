import { render, screen } from '@testing-library/react'
import Sparkline from './Sparkline'

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

describe('Sparkline', () => {
  const mockData = [
    { timestamp: 1000, value: 20 },
    { timestamp: 2000, value: 21 },
    { timestamp: 3000, value: 22 },
    { timestamp: 4000, value: 21.5 },
    { timestamp: 5000, value: 23 },
  ]

  describe('rendering', () => {
    it('renders SVG chart container', () => {
      render(<Sparkline data={mockData} />)

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('renders within ResponsiveContainer', () => {
      render(<Sparkline data={mockData} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('renders Line component with data', () => {
      render(<Sparkline data={mockData} />)

      const line = screen.getByTestId('sparkline-line')
      expect(line).toBeInTheDocument()
      expect(line).toHaveAttribute('data-key', 'value')
    })

    it('passes data points to LineChart', () => {
      render(<Sparkline data={mockData} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '5')
    })
  })

  describe('current value display', () => {
    it('shows current value when showValue is true', () => {
      render(<Sparkline data={mockData} showValue />)

      expect(screen.getByText('23')).toBeInTheDocument()
    })

    it('formats value with unit when provided', () => {
      render(<Sparkline data={mockData} showValue unit="°C" />)

      expect(screen.getByText('23°C')).toBeInTheDocument()
    })

    it('does not show value when showValue is false', () => {
      render(<Sparkline data={mockData} showValue={false} />)

      expect(screen.queryByText('23')).not.toBeInTheDocument()
    })

    it('formats value with specified decimal places', () => {
      const dataWithDecimals = [
        { timestamp: 1000, value: 20.123 },
        { timestamp: 2000, value: 21.456 },
      ]
      render(<Sparkline data={dataWithDecimals} showValue decimals={1} />)

      expect(screen.getByText('21.5')).toBeInTheDocument()
    })
  })

  describe('empty data handling', () => {
    it('handles empty data array gracefully', () => {
      render(<Sparkline data={[]} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '0')
    })

    it('handles undefined data gracefully', () => {
      render(<Sparkline data={undefined} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '0')
    })

    it('handles null data gracefully', () => {
      render(<Sparkline data={null} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-points', '0')
    })

    it('does not show value when data is empty', () => {
      render(<Sparkline data={[]} showValue />)

      // Should not crash and should not show any value
      expect(screen.queryByText(/°C/)).not.toBeInTheDocument()
    })
  })

  describe('customization', () => {
    it('applies custom color to line', () => {
      render(<Sparkline data={mockData} color="#ff0000" />)

      const line = screen.getByTestId('sparkline-line')
      expect(line).toHaveAttribute('data-stroke', '#ff0000')
    })

    it('uses default color when not specified', () => {
      render(<Sparkline data={mockData} />)

      const line = screen.getByTestId('sparkline-line')
      expect(line).toHaveAttribute('data-stroke', '#1976d2')
    })

    it('applies custom width and height', () => {
      const { container } = render(
        <Sparkline data={mockData} width={100} height={30} />
      )

      const wrapper = container.querySelector(
        '[data-testid="sparkline-wrapper"]'
      )
      expect(wrapper).toHaveStyle({ width: '100px', height: '30px' })
    })
  })
})
