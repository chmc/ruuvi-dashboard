import { render, screen } from '@testing-library/react'
import ErrorAlert from './ErrorAlert'

describe('ErrorAlert', () => {
  describe('rendering', () => {
    it('should render Alert when error message is provided', () => {
      render(<ErrorAlert error="Something went wrong" />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should not render anything when error is null', () => {
      const { container } = render(<ErrorAlert error={null} />)

      expect(container.firstChild).toBeNull()
    })

    it('should not render anything when error is undefined', () => {
      const { container } = render(<ErrorAlert error={undefined} />)

      expect(container.firstChild).toBeNull()
    })

    it('should not render anything when error is empty string', () => {
      const { container } = render(<ErrorAlert error="" />)

      expect(container.firstChild).toBeNull()
    })

    it('should render with data-testid error-alert', () => {
      render(<ErrorAlert error="Test error" />)

      expect(screen.getByTestId('error-alert')).toBeInTheDocument()
    })

    it('should display the error message text', () => {
      render(<ErrorAlert error="Network connection failed" />)

      expect(screen.getByText('Network connection failed')).toBeInTheDocument()
    })
  })

  describe('severity prop', () => {
    it('should use error severity by default', () => {
      render(<ErrorAlert error="Test error" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('MuiAlert-standardError')
    })

    it('should use warning severity when specified', () => {
      render(<ErrorAlert error="Warning message" severity="warning" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('MuiAlert-standardWarning')
    })

    it('should use info severity when specified', () => {
      render(<ErrorAlert error="Info message" severity="info" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('MuiAlert-standardInfo')
    })

    it('should use success severity when specified', () => {
      render(<ErrorAlert error="Success message" severity="success" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('MuiAlert-standardSuccess')
    })
  })

  describe('sx prop', () => {
    it('should apply default margin bottom when no sx prop', () => {
      render(<ErrorAlert error="Test error" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveStyle({ marginBottom: '16px' })
    })

    it('should merge custom sx with default styles', () => {
      render(<ErrorAlert error="Test error" sx={{ mt: 2 }} />)

      const alert = screen.getByRole('alert')
      // Default mb: 2 should still apply
      expect(alert).toHaveStyle({ marginBottom: '16px' })
      // Custom mt: 2 should also apply
      expect(alert).toHaveStyle({ marginTop: '16px' })
    })

    it('should allow overriding default margin bottom', () => {
      render(<ErrorAlert error="Test error" sx={{ mb: 4 }} />)

      const alert = screen.getByRole('alert')
      // Custom mb: 4 should override default
      expect(alert).toHaveStyle({ marginBottom: '32px' })
    })
  })
})
