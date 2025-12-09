import { render, screen } from '@testing-library/react'
import LoadingOverlay from './LoadingOverlay'

describe('LoadingOverlay', () => {
  describe('rendering', () => {
    it('should render CircularProgress when loading is true', () => {
      render(<LoadingOverlay loading />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should not render anything when loading is false', () => {
      const { container } = render(<LoadingOverlay loading={false} />)

      expect(container.firstChild).toBeNull()
    })

    it('should render with data-testid loading-overlay', () => {
      render(<LoadingOverlay loading />)

      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
    })
  })

  describe('message prop', () => {
    it('should display message when provided', () => {
      render(<LoadingOverlay loading message="Loading data..." />)

      expect(screen.getByText('Loading data...')).toBeInTheDocument()
    })

    it('should not display message when not provided', () => {
      render(<LoadingOverlay loading />)

      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  describe('fullScreen prop', () => {
    it('should render with minHeight 400px when fullScreen is true', () => {
      render(<LoadingOverlay loading fullScreen />)

      const overlay = screen.getByTestId('loading-overlay')
      expect(overlay).toHaveStyle({ minHeight: '400px' })
    })

    it('should render with default padding when fullScreen is false', () => {
      render(<LoadingOverlay loading />)

      const overlay = screen.getByTestId('loading-overlay')
      // Default py: 4 (32px padding) without minHeight
      expect(overlay).not.toHaveStyle({ minHeight: '400px' })
    })
  })

  describe('size prop', () => {
    it('should pass size to CircularProgress', () => {
      render(<LoadingOverlay loading size={60} />)

      const progress = screen.getByRole('progressbar')
      // MUI CircularProgress sets width and height via style
      expect(progress).toHaveStyle({ width: '60px', height: '60px' })
    })

    it('should use default size of 40 when not specified', () => {
      render(<LoadingOverlay loading />)

      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveStyle({ width: '40px', height: '40px' })
    })
  })
})
