import { render, screen } from '@testing-library/react'
import DiagnosticsScreen from './DiagnosticsScreen'

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

