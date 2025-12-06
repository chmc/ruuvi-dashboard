import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiagnosticsScreen from './DiagnosticsScreen'
import apiService from '../services/api'

// Mock configs
jest.mock('../configs', () => ({
  macIds: ['aa:bb:cc:dd:ee:ff', '11:22:33:44:55:66'],
  ruuviTags: [
    { mac: 'aa:bb:cc:dd:ee:ff', name: 'Indoor Sensor' },
    { mac: '11:22:33:44:55:66', name: 'Outdoor Sensor' },
  ],
}))

// Mock formatters
jest.mock('../utils/formatters', () => ({
  toLocalDateTime: (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('fi-FI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  },
}))

// Mock API service
jest.mock('../services/api')

describe('DiagnosticsScreen', () => {
  const mockDiagnostics = {
    bufferSize: 42,
    lastFlushTime: Date.now() - 600000, // 10 minutes ago
    batteries: [
      {
        mac: 'aa:bb:cc:dd:ee:ff',
        voltage: 2.8,
        lastSeen: Date.now() - 30000, // 30 seconds ago
      },
      {
        mac: '11:22:33:44:55:66',
        voltage: 2.6,
        lastSeen: Date.now() - 60000, // 1 minute ago
      },
    ],
    dbSize: 1024000, // 1 MB
    oldestRecord: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    uptime: 3600000, // 1 hour
  }

  beforeEach(() => {
    jest.clearAllMocks()
    apiService.getDiagnostics.mockResolvedValue(mockDiagnostics)
  })

  describe('API Integration', () => {
    it('should call diagnostics API on mount', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(apiService.getDiagnostics).toHaveBeenCalledWith([
          'aa:bb:cc:dd:ee:ff',
          '11:22:33:44:55:66',
        ])
      })
    })

    it('should show loading state while fetching', () => {
      apiService.getDiagnostics.mockReturnValueOnce(
        new Promise(() => {}) // Never resolves
      )

      render(<DiagnosticsScreen />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should display buffer size correctly', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/buffer size/i)).toBeInTheDocument()
        expect(screen.getByText(/42 readings/i)).toBeInTheDocument()
      })
    })

    it('should display last flush time correctly', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/last flush/i)).toBeInTheDocument()
      })
    })

    it('should display all battery levels', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/indoor sensor/i)).toBeInTheDocument()
        expect(screen.getByText(/outdoor sensor/i)).toBeInTheDocument()
      })
    })

    it('should display system info (DB size, uptime, oldest record)', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/database size/i)).toBeInTheDocument()
        expect(screen.getByText(/server uptime/i)).toBeInTheDocument()
        expect(screen.getByText(/oldest record/i)).toBeInTheDocument()
      })
    })

    it('should show error message when API fails', async () => {
      apiService.getDiagnostics.mockRejectedValueOnce(
        new Error('Failed to fetch diagnostics')
      )

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(
          screen.getByText(/failed to fetch diagnostics/i)
        ).toBeInTheDocument()
      })
    })

    it('should refresh diagnostics after flush', async () => {
      const user = userEvent.setup()
      apiService.flushBuffer.mockResolvedValueOnce({
        success: true,
        flushedCount: 25,
        message: 'Buffer flushed successfully',
      })

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(apiService.getDiagnostics).toHaveBeenCalledTimes(1)
        expect(screen.getByRole('button', { name: /flush buffer/i })).toBeInTheDocument()
      })

      const flushButton = screen.getByRole('button', { name: /flush buffer/i })
      await user.click(flushButton)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(apiService.getDiagnostics).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Layout', () => {
    it('should render with title', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /diagnostics/i })
        ).toBeInTheDocument()
      })
    })

    it('should render buffer status section', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/buffer status/i)).toBeInTheDocument()
      })
    })

    it('should render battery levels section', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/battery levels/i)).toBeInTheDocument()
      })
    })

    it('should render system info section', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/system info/i)).toBeInTheDocument()
      })
    })
  })

  describe('Flush Button', () => {
    it('should render flush button', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /flush buffer/i })
        ).toBeInTheDocument()
      })
    })

    it('should show confirmation dialog when clicking flush button', async () => {
      const user = userEvent.setup()
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /flush buffer/i })
        ).toBeInTheDocument()
      })

      const flushButton = screen.getByRole('button', { name: /flush buffer/i })
      await user.click(flushButton)

      expect(
        screen.getByRole('dialog', { name: /confirm flush/i })
      ).toBeInTheDocument()
      expect(
        screen.getByText(/are you sure you want to flush the buffer/i)
      ).toBeInTheDocument()
    })

    it('should call flush API when confirming', async () => {
      const user = userEvent.setup()
      apiService.flushBuffer.mockResolvedValueOnce({
        success: true,
        flushedCount: 25,
        message: 'Buffer flushed successfully',
      })

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /flush buffer/i })
        ).toBeInTheDocument()
      })

      const flushButton = screen.getByRole('button', { name: /flush buffer/i })
      await user.click(flushButton)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(apiService.flushBuffer).toHaveBeenCalledTimes(1)
      })
    })

    it('should show success message after successful flush', async () => {
      const user = userEvent.setup()
      apiService.flushBuffer.mockResolvedValueOnce({
        success: true,
        flushedCount: 25,
        message: 'Buffer flushed successfully',
      })

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /flush buffer/i })
        ).toBeInTheDocument()
      })

      const flushButton = screen.getByRole('button', { name: /flush buffer/i })
      await user.click(flushButton)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(
          screen.getByText(/buffer flushed successfully/i)
        ).toBeInTheDocument()
      })
    })

    it('should disable button while flushing', async () => {
      const user = userEvent.setup()
      let resolveFlush
      const flushPromise = new Promise((resolve) => {
        resolveFlush = resolve
      })
      apiService.flushBuffer.mockReturnValueOnce(flushPromise)

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /flush buffer/i })
        ).toBeInTheDocument()
      })

      const flushButton = screen.getByRole('button', { name: /flush buffer/i })
      await user.click(flushButton)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      // Wait for button to be disabled and show "Flushing..." text
      await waitFor(() => {
        expect(flushButton).toBeDisabled()
        expect(screen.getByText(/flushing.../i)).toBeInTheDocument()
      })

      resolveFlush({
        success: true,
        flushedCount: 25,
        message: 'Buffer flushed successfully',
      })

      await waitFor(() => {
        expect(flushButton).not.toBeDisabled()
        expect(screen.queryByText(/flushing.../i)).not.toBeInTheDocument()
      })
    })

    it('should show error message when flush fails', async () => {
      const user = userEvent.setup()
      apiService.flushBuffer.mockRejectedValueOnce(
        new Error('Failed to flush buffer')
      )

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /flush buffer/i })
        ).toBeInTheDocument()
      })

      const flushButton = screen.getByRole('button', { name: /flush buffer/i })
      await user.click(flushButton)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      // Wait for error to appear and button to be re-enabled
      await waitFor(() => {
        expect(screen.getByText(/failed to flush buffer/i)).toBeInTheDocument()
        expect(flushButton).not.toBeDisabled()
      }, { timeout: 3000 })
    })

    it('should close confirmation dialog when canceling', async () => {
      const user = userEvent.setup()
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /flush buffer/i })
        ).toBeInTheDocument()
      })

      const flushButton = screen.getByRole('button', { name: /flush buffer/i })
      await user.click(flushButton)

      expect(
        screen.getByRole('dialog', { name: /confirm flush/i })
      ).toBeInTheDocument()

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(
          screen.queryByRole('dialog', { name: /confirm flush/i })
        ).not.toBeInTheDocument()
      })

      expect(apiService.flushBuffer).not.toHaveBeenCalled()
    })
  })
})

