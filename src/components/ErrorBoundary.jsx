import { Component } from 'react'
import ErrorFallback from './ErrorFallback'

/**
 * Error Boundary component that catches JavaScript errors in child component tree
 * @extends {Component<{children: React.ReactNode, fallback?: React.ComponentType<{error: Error, onReset: Function}>}>}
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (could be sent to error reporting service)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback: FallbackComponent } = this.props

    if (hasError) {
      const Fallback = FallbackComponent || ErrorFallback
      return <Fallback error={error} onReset={this.resetErrorBoundary} />
    }

    return children
  }
}

export default ErrorBoundary
