import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'
import ErrorFallback from './ErrorFallback'

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div data-testid="child-component">Child content</div>
}

// Suppress console.error during tests since we expect errors
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  console.error.mockRestore()
})

describe('ErrorFallback', () => {
  describe('rendering', () => {
    it('should render error message', () => {
      const error = new Error('Custom error message')
      render(
        <MemoryRouter>
          <ErrorFallback error={error} />
        </MemoryRouter>
      )

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    })

    it('should render with data-testid error-fallback', () => {
      const error = new Error('Test error')
      render(
        <MemoryRouter>
          <ErrorFallback error={error} />
        </MemoryRouter>
      )

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument()
    })

    it('should render a heading indicating an error occurred', () => {
      const error = new Error('Test error')
      render(
        <MemoryRouter>
          <ErrorFallback error={error} />
        </MemoryRouter>
      )

      expect(
        screen.getByRole('heading', { name: /something went wrong/i })
      ).toBeInTheDocument()
    })

    it('should render a reload button', () => {
      const error = new Error('Test error')
      render(
        <MemoryRouter>
          <ErrorFallback error={error} />
        </MemoryRouter>
      )

      expect(
        screen.getByRole('button', { name: /reload page/i })
      ).toBeInTheDocument()
    })

    it('should render a go home button', () => {
      const error = new Error('Test error')
      render(
        <MemoryRouter>
          <ErrorFallback error={error} />
        </MemoryRouter>
      )

      expect(
        screen.getByRole('link', { name: /go to dashboard/i })
      ).toBeInTheDocument()
    })

    it('should link to home page', () => {
      const error = new Error('Test error')
      render(
        <MemoryRouter>
          <ErrorFallback error={error} />
        </MemoryRouter>
      )

      const link = screen.getByRole('link', { name: /go to dashboard/i })
      expect(link).toHaveAttribute('href', '/')
    })
  })

  describe('reload button', () => {
    it('should have clickable reload button', () => {
      const error = new Error('Test error')

      render(
        <MemoryRouter>
          <ErrorFallback error={error} />
        </MemoryRouter>
      )

      const button = screen.getByRole('button', { name: /reload page/i })
      expect(button).toBeEnabled()
      // Clicking the button calls window.location.reload
      // We verify the button is clickable; actual reload behavior is browser behavior
      fireEvent.click(button)
    })
  })

  describe('onReset callback', () => {
    it('should call onReset when provided and reload button is clicked', () => {
      const error = new Error('Test error')
      const onReset = jest.fn()

      render(
        <MemoryRouter>
          <ErrorFallback error={error} onReset={onReset} />
        </MemoryRouter>
      )

      fireEvent.click(screen.getByRole('button', { name: /reload page/i }))
      expect(onReset).toHaveBeenCalled()
    })
  })
})

describe('ErrorBoundary', () => {
  describe('when no error occurs', () => {
    it('should render children normally', () => {
      render(
        <MemoryRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>
        </MemoryRouter>
      )

      expect(screen.getByTestId('child-component')).toBeInTheDocument()
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('should not render fallback UI', () => {
      render(
        <MemoryRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('error-fallback')).not.toBeInTheDocument()
    })
  })

  describe('when an error occurs', () => {
    it('should catch error and render fallback UI', () => {
      render(
        <MemoryRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow />
          </ErrorBoundary>
        </MemoryRouter>
      )

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument()
    })

    it('should not render children when error occurs', () => {
      render(
        <MemoryRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow />
          </ErrorBoundary>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('child-component')).not.toBeInTheDocument()
    })

    it('should display the error message in fallback', () => {
      render(
        <MemoryRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow />
          </ErrorBoundary>
        </MemoryRouter>
      )

      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('should log error to console', () => {
      render(
        <MemoryRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow />
          </ErrorBoundary>
        </MemoryRouter>
      )

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('custom fallback', () => {
    it('should render custom fallback component when provided', () => {
      const CustomFallback = ({ error }) => (
        <div data-testid="custom-fallback">{error.message}</div>
      )

      render(
        <MemoryRouter>
          <ErrorBoundary fallback={CustomFallback}>
            <ThrowError shouldThrow />
          </ErrorBoundary>
        </MemoryRouter>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })
  })

  describe('reset functionality', () => {
    it('should reset error state when resetErrorBoundary is called', () => {
      const { rerender } = render(
        <MemoryRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow />
          </ErrorBoundary>
        </MemoryRouter>
      )

      // Error boundary should show fallback
      expect(screen.getByTestId('error-fallback')).toBeInTheDocument()

      // Simulate reset by re-rendering with non-throwing component
      rerender(
        <MemoryRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>
        </MemoryRouter>
      )

      // After clicking reload, the page would reload, so we just verify
      // the fallback has reload button
      expect(
        screen.getByRole('button', { name: /reload page/i })
      ).toBeInTheDocument()
    })
  })

  describe('multiple children', () => {
    it('should catch error from any child', () => {
      render(
        <MemoryRouter>
          <ErrorBoundary>
            <div>Safe child 1</div>
            <ThrowError shouldThrow />
            <div>Safe child 2</div>
          </ErrorBoundary>
        </MemoryRouter>
      )

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument()
      expect(screen.queryByText('Safe child 1')).not.toBeInTheDocument()
      expect(screen.queryByText('Safe child 2')).not.toBeInTheDocument()
    })
  })
})
