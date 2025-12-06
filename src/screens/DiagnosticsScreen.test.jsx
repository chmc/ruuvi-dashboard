import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiagnosticsScreen from './DiagnosticsScreen'
import apiService from '../services/api'

// Mock configs
jest.mock('../configs', () => ({
  ruuviTags: [
    { mac: 'aa:bb:cc:dd:ee:ff', name: 'Indoor Sensor' },
    { mac: '11:22:33:44:55:66', name: 'Outdoor Sensor' },
  ],
}))

// Mock API service
jest.mock('../services/api')

describe('DiagnosticsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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

  describe('Flush Button', () => {
    it('should render flush button', () => {
      render(<DiagnosticsScreen />)

      expect(
        screen.getByRole('button', { name: /flush buffer/i })
      ).toBeInTheDocument()
    })

    it('should show confirmation dialog when clicking flush button', async () => {
      const user = userEvent.setup()
      render(<DiagnosticsScreen />)

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

      const flushButton = screen.getByRole('button', { name: /flush buffer/i })
      await user.click(flushButton)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(flushButton).toBeDisabled()
      })

      resolveFlush({
        success: true,
        flushedCount: 25,
        message: 'Buffer flushed successfully',
      })

      await waitFor(() => {
        expect(flushButton).not.toBeDisabled()
      })
    })

    it('should show error message when flush fails', async () => {
      const user = userEvent.setup()
      apiService.flushBuffer.mockRejectedValueOnce(
        new Error('Failed to flush buffer')
      )

      render(<DiagnosticsScreen />)

      const flushButton = screen.getByRole('button', { name: /flush buffer/i })
      await user.click(flushButton)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to flush buffer/i)).toBeInTheDocument()
      })
    })

    it('should close confirmation dialog when canceling', async () => {
      const user = userEvent.setup()
      render(<DiagnosticsScreen />)

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

