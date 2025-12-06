import { render, screen } from '@testing-library/react'
import DiagnosticsScreen from './DiagnosticsScreen'

// Mock configs
jest.mock('../configs', () => ({
  ruuviTags: [
    { mac: 'aa:bb:cc:dd:ee:ff', name: 'Indoor Sensor' },
    { mac: '11:22:33:44:55:66', name: 'Outdoor Sensor' },
  ],
}))

describe('DiagnosticsScreen', () => {
  describe('Layout', () => {
    it('should render with title', () => {
      render(<DiagnosticsScreen />)

      expect(
        screen.getByRole('heading', { name: /diagnostics/i })
      ).toBeInTheDocument()
    })

    it('should render buffer status section', () => {
      render(<DiagnosticsScreen />)

      expect(screen.getByText(/buffer status/i)).toBeInTheDocument()
    })

    it('should render battery levels section', () => {
      render(<DiagnosticsScreen />)

      expect(screen.getByText(/battery levels/i)).toBeInTheDocument()
    })

    it('should render system info section', () => {
      render(<DiagnosticsScreen />)

      expect(screen.getByText(/system info/i)).toBeInTheDocument()
    })
  })
})

