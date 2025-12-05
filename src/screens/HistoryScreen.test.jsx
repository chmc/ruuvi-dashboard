import { render, screen, fireEvent } from '@testing-library/react'
import HistoryScreen from './HistoryScreen'

// Mock configs
jest.mock('../configs', () => ({
  ruuviTags: [
    { mac: 'aa:bb:cc:dd:ee:01', name: 'Living Room' },
    { mac: 'aa:bb:cc:dd:ee:02', name: 'Bedroom' },
    { mac: 'aa:bb:cc:dd:ee:03', name: 'Outside' },
  ],
  macIds: ['aa:bb:cc:dd:ee:01', 'aa:bb:cc:dd:ee:02', 'aa:bb:cc:dd:ee:03'],
}))

describe('HistoryScreen', () => {
  describe('Layout', () => {
    it('should render with title', () => {
      render(<HistoryScreen />)

      expect(
        screen.getByRole('heading', { name: /history/i })
      ).toBeInTheDocument()
    })

    it('should render time range buttons', () => {
      render(<HistoryScreen />)

      expect(screen.getByRole('button', { name: '1h' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '6h' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '24h' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '30d' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    })

    it('should have 24h selected by default', () => {
      render(<HistoryScreen />)

      const button24h = screen.getByRole('button', { name: '24h' })
      expect(button24h).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Time Range Selection', () => {
    it('should update selection when clicking a time range button', () => {
      render(<HistoryScreen />)

      const button7d = screen.getByRole('button', { name: '7d' })
      fireEvent.click(button7d)

      expect(button7d).toHaveAttribute('aria-pressed', 'true')

      // Previous selection should be deselected
      const button24h = screen.getByRole('button', { name: '24h' })
      expect(button24h).toHaveAttribute('aria-pressed', 'false')
    })

    it('should allow selecting different time ranges', () => {
      render(<HistoryScreen />)

      // Click through all time ranges
      const timeRanges = ['1h', '6h', '24h', '7d', '30d', 'All']

      timeRanges.forEach((range) => {
        const button = screen.getByRole('button', { name: range })
        fireEvent.click(button)
        expect(button).toHaveAttribute('aria-pressed', 'true')
      })
    })
  })

  describe('Sensor List', () => {
    it('should render sensor list for each configured sensor', () => {
      render(<HistoryScreen />)

      expect(screen.getByText('Living Room')).toBeInTheDocument()
      expect(screen.getByText('Bedroom')).toBeInTheDocument()
      expect(screen.getByText('Outside')).toBeInTheDocument()
    })

    it('should render sensor items in a list', () => {
      render(<HistoryScreen />)

      const sensorItems = screen.getAllByTestId('sensor-item')
      expect(sensorItems).toHaveLength(3)
    })
  })
})
