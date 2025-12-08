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
  const now = Date.now()
  const mockDiagnostics = {
    bufferSize: 42,
    lastFlushTime: now - 600000, // 10 minutes ago
    batteries: [
      {
        mac: 'aa:bb:cc:dd:ee:ff',
        voltage: 2.8,
        lastSeen: now - 30000, // 30 seconds ago
      },
      {
        mac: '11:22:33:44:55:66',
        voltage: 2.6,
        lastSeen: now - 60000, // 1 minute ago
      },
    ],
    sensorHealth: [
      {
        mac: 'aa:bb:cc:dd:ee:ff',
        lastSeen: now - 30000, // 30 seconds ago
        rssi: -65,
        status: 'online',
      },
      {
        mac: '11:22:33:44:55:66',
        lastSeen: now - 60000, // 1 minute ago
        rssi: -80,
        status: 'online',
      },
    ],
    dbSize: 1024000, // 1 MB
    oldestRecord: now - 90 * 24 * 60 * 60 * 1000, // 90 days ago
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
        // Sensor names appear in both Sensor Health and Battery Levels sections
        expect(screen.getAllByText(/indoor sensor/i)).toHaveLength(2)
        expect(screen.getAllByText(/outdoor sensor/i)).toHaveLength(2)
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
        expect(
          screen.getByRole('button', { name: /flush buffer/i })
        ).toBeInTheDocument()
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

  describe('Sensor Health', () => {
    it('should render sensor health section', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/sensor health/i)).toBeInTheDocument()
      })
    })

    it('should display last seen timestamp for each sensor', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        // Should show sensor names in Sensor Health section
        expect(screen.getByText(/sensor health/i)).toBeInTheDocument()
        // Check that sensor name and online status are present
        const onlineChips = screen.getAllByText(/online/i)
        expect(onlineChips.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('should display RSSI (signal strength) for each sensor', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/-65 dBm/i)).toBeInTheDocument()
        expect(screen.getByText(/-80 dBm/i)).toBeInTheDocument()
      })
    })

    it('should show stale sensor warning', async () => {
      const staleDiagnostics = {
        ...mockDiagnostics,
        sensorHealth: [
          {
            mac: 'aa:bb:cc:dd:ee:ff',
            lastSeen: Date.now() - 6 * 60 * 1000, // 6 minutes ago (stale)
            rssi: -65,
            status: 'stale',
          },
        ],
      }
      apiService.getDiagnostics.mockResolvedValueOnce(staleDiagnostics)

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/stale/i)).toBeInTheDocument()
      })
    })

    it('should show offline sensor warning', async () => {
      const offlineDiagnostics = {
        ...mockDiagnostics,
        sensorHealth: [
          {
            mac: 'aa:bb:cc:dd:ee:ff',
            lastSeen: null,
            rssi: null,
            status: 'offline',
          },
        ],
      }
      apiService.getDiagnostics.mockResolvedValueOnce(offlineDiagnostics)

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument()
      })
    })
  })

  describe('System Resources', () => {
    const diagnosticsWithSystemResources = {
      ...mockDiagnostics,
      systemResources: {
        memory: {
          heapUsed: 50 * 1024 * 1024, // 50 MB
          heapTotal: 100 * 1024 * 1024, // 100 MB
          rss: 150 * 1024 * 1024, // 150 MB
          external: 5 * 1024 * 1024, // 5 MB
        },
        nodeVersion: 'v20.10.0',
        disk: {
          free: 10 * 1024 * 1024 * 1024, // 10 GB
          total: 100 * 1024 * 1024 * 1024, // 100 GB
        },
      },
    }

    beforeEach(() => {
      apiService.getDiagnostics.mockResolvedValue(
        diagnosticsWithSystemResources
      )
    })

    it('should render system resources section', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/system resources/i)).toBeInTheDocument()
      })
    })

    it('should display memory usage (heap used/total)', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/heap memory/i)).toBeInTheDocument()
        expect(screen.getByText(/50.*MB.*\/.*100.*MB/i)).toBeInTheDocument()
      })
    })

    it('should display Node.js version', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/node\.js/i)).toBeInTheDocument()
        expect(screen.getByText(/v20\.10\.0/)).toBeInTheDocument()
      })
    })

    it('should display disk space remaining', async () => {
      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/disk space/i)).toBeInTheDocument()
        expect(screen.getByText(/10.*GB.*free/i)).toBeInTheDocument()
      })
    })

    it('should refresh values on diagnostics reload', async () => {
      const user = userEvent.setup()
      apiService.flushBuffer.mockResolvedValueOnce({
        success: true,
        flushedCount: 25,
        message: 'Buffer flushed successfully',
      })

      const updatedDiagnostics = {
        ...diagnosticsWithSystemResources,
        systemResources: {
          ...diagnosticsWithSystemResources.systemResources,
          memory: {
            ...diagnosticsWithSystemResources.systemResources.memory,
            heapUsed: 60 * 1024 * 1024, // Changed to 60 MB
          },
        },
      }

      // First call returns original, second returns updated
      apiService.getDiagnostics
        .mockResolvedValueOnce(diagnosticsWithSystemResources)
        .mockResolvedValueOnce(updatedDiagnostics)

      render(<DiagnosticsScreen />)

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText(/50.*MB.*\/.*100.*MB/i)).toBeInTheDocument()
      })

      // Trigger flush which causes refresh
      const flushButton = screen.getByRole('button', { name: /flush buffer/i })
      await user.click(flushButton)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      // Wait for updated values
      await waitFor(() => {
        expect(screen.getByText(/60.*MB.*\/.*100.*MB/i)).toBeInTheDocument()
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
      await waitFor(
        () => {
          expect(
            screen.getByText(/failed to flush buffer/i)
          ).toBeInTheDocument()
          expect(flushButton).not.toBeDisabled()
        },
        { timeout: 3000 }
      )
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

  describe('External APIs Section', () => {
    const diagnosticsWithExternalApis = {
      ...mockDiagnostics,
      externalApis: {
        energyPrices: {
          status: 'ok',
          lastSuccess: Date.now() - 60000, // 1 minute ago
          lastError: null,
          errorMessage: null,
        },
        openWeatherMap: {
          status: 'ok',
          lastSuccess: Date.now() - 120000, // 2 minutes ago
          lastError: null,
          errorMessage: null,
        },
      },
    }

    it('should render external APIs section', async () => {
      apiService.getDiagnostics.mockResolvedValue(diagnosticsWithExternalApis)

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/external apis/i)).toBeInTheDocument()
      })
    })

    it('should display energy prices API status as OK', async () => {
      apiService.getDiagnostics.mockResolvedValue(diagnosticsWithExternalApis)

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/energy prices/i)).toBeInTheDocument()
        // Should show OK chip in the External APIs section
        expect(screen.getAllByText(/^OK$/i).length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should display OpenWeatherMap API status as OK', async () => {
      apiService.getDiagnostics.mockResolvedValue(diagnosticsWithExternalApis)

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/openweathermap/i)).toBeInTheDocument()
        // Should show OK chip in the External APIs section
        expect(screen.getAllByText(/^OK$/i).length).toBeGreaterThanOrEqual(2)
      })
    })

    it('should display last successful fetch timestamp for each API', async () => {
      apiService.getDiagnostics.mockResolvedValue(diagnosticsWithExternalApis)

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        // Check that last success times are displayed
        expect(
          screen.getAllByText(/last success/i).length
        ).toBeGreaterThanOrEqual(1)
      })
    })

    it('should display error status with error message when API fails', async () => {
      const diagnosticsWithError = {
        ...mockDiagnostics,
        externalApis: {
          energyPrices: {
            status: 'error',
            lastSuccess: Date.now() - 3600000, // 1 hour ago
            lastError: Date.now() - 60000, // 1 minute ago
            errorMessage: 'Network timeout',
          },
          openWeatherMap: {
            status: 'ok',
            lastSuccess: Date.now() - 120000,
            lastError: null,
            errorMessage: null,
          },
        },
      }

      apiService.getDiagnostics.mockResolvedValue(diagnosticsWithError)

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/energy prices/i)).toBeInTheDocument()
        expect(screen.getByText(/network timeout/i)).toBeInTheDocument()
      })
    })

    it('should display unknown status when API has not been called', async () => {
      const diagnosticsWithUnknown = {
        ...mockDiagnostics,
        externalApis: {
          energyPrices: {
            status: 'unknown',
            lastSuccess: null,
            lastError: null,
            errorMessage: null,
          },
          openWeatherMap: {
            status: 'unknown',
            lastSuccess: null,
            lastError: null,
            errorMessage: null,
          },
        },
      }

      apiService.getDiagnostics.mockResolvedValue(diagnosticsWithUnknown)

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        // Should show unknown status indicators
        expect(screen.getAllByText(/unknown/i).length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should show status indicator with appropriate color', async () => {
      const diagnosticsWithMixedStatus = {
        ...mockDiagnostics,
        externalApis: {
          energyPrices: {
            status: 'ok',
            lastSuccess: Date.now(),
            lastError: null,
            errorMessage: null,
          },
          openWeatherMap: {
            status: 'error',
            lastSuccess: Date.now() - 3600000,
            lastError: Date.now(),
            errorMessage: 'Invalid API key',
          },
        },
      }

      apiService.getDiagnostics.mockResolvedValue(diagnosticsWithMixedStatus)

      render(<DiagnosticsScreen />)

      await waitFor(() => {
        expect(screen.getByText(/energy prices/i)).toBeInTheDocument()
        expect(screen.getByText(/openweathermap/i)).toBeInTheDocument()
        expect(screen.getByText(/invalid api key/i)).toBeInTheDocument()
      })
    })
  })
})
