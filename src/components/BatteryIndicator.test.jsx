import { render, screen } from '@testing-library/react'
import BatteryIndicator from './BatteryIndicator'

// Mock configs
jest.mock('../configs', () => ({
  ruuviTags: [
    { mac: 'aa:bb:cc:dd:ee:ff', name: 'Indoor Sensor' },
    { mac: '11:22:33:44:55:66', name: 'Outdoor Sensor' },
  ],
}))

describe('BatteryIndicator', () => {
  describe('battery bar rendering', () => {
    it('should render battery bar with correct fill percentage', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={3.0} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      // 3.0V should be approximately 77% (3.0 - 2.0) / (3.3 - 2.0) * 100
      expect(progressBar).toHaveAttribute('aria-valuenow', expect.any(String))
    })

    it('should render battery bar at 0% for minimum voltage', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={2.0} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '0')
    })

    it('should render battery bar at 100% for maximum voltage', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={3.3} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    })
  })

  describe('status colors', () => {
    it('should show green color for OK status (>2.7V)', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={2.8} />)

      const progressBar = screen.getByRole('progressbar')
      // MUI LinearProgress uses sx prop for styling
      expect(progressBar).toBeInTheDocument()
      // Check that status text shows "OK"
      expect(screen.getByText(/ok/i)).toBeInTheDocument()
    })

    it('should show yellow color for Low status (2.5-2.7V)', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={2.6} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      // Check that status text shows "Low"
      expect(screen.getByText(/low/i)).toBeInTheDocument()
    })

    it('should show red color for Critical status (<2.5V)', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={2.4} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      // Check that status text shows "Critical"
      expect(screen.getByText(/critical/i)).toBeInTheDocument()
    })

    it('should show green color for exactly 2.7V (boundary)', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={2.7} />)

      expect(screen.getByText(/ok/i)).toBeInTheDocument()
    })

    it('should show yellow color for exactly 2.5V (boundary)', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={2.5} />)

      expect(screen.getByText(/low/i)).toBeInTheDocument()
    })
  })

  describe('voltage display', () => {
    it('should display voltage value', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={3.0} />)

      expect(screen.getByText(/3\.0\s*V/i)).toBeInTheDocument()
    })

    it('should display voltage with one decimal place', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={2.65} />)

      expect(screen.getByText(/2\.6\s*V/i)).toBeInTheDocument()
    })

    it('should display voltage when null', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={null} />)

      expect(screen.getByText(/-/)).toBeInTheDocument()
    })
  })

  describe('sensor name display', () => {
    it('should display sensor name from configs', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={3.0} />)

      expect(screen.getByText('Indoor Sensor')).toBeInTheDocument()
    })

    it('should display MAC address when name not found', () => {
      render(<BatteryIndicator mac="unknown:mac:address" voltage={3.0} />)

      expect(screen.getByText('unknown:mac:address')).toBeInTheDocument()
    })
  })

  describe('status text display', () => {
    it('should display OK status text for >2.7V', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={2.8} />)

      expect(screen.getByText(/ok/i)).toBeInTheDocument()
    })

    it('should display Low status text for 2.5-2.7V', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={2.6} />)

      expect(screen.getByText(/low/i)).toBeInTheDocument()
    })

    it('should display Critical status text for <2.5V', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={2.4} />)

      expect(screen.getByText(/critical/i)).toBeInTheDocument()
    })

    it('should display Unknown status text when voltage is null', () => {
      render(<BatteryIndicator mac="aa:bb:cc:dd:ee:ff" voltage={null} />)

      expect(screen.getByText(/unknown/i)).toBeInTheDocument()
    })
  })
})

