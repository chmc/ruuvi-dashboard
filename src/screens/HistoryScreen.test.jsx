import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import HistoryScreen from './HistoryScreen'
import apiService from '../services/api'
import { ChartConfigProvider } from '../contexts/ChartConfigContext'

// Wrapper component to provide required context
const theme = createTheme({ palette: { mode: 'dark' } })

const renderWithProviders = (ui) =>
  render(
    <ThemeProvider theme={theme}>
      <ChartConfigProvider>{ui}</ChartConfigProvider>
    </ThemeProvider>
  )

// Mock configs
jest.mock('../configs', () => ({
  ruuviTags: [
    { mac: 'aa:bb:cc:dd:ee:01', name: 'Living Room' },
    { mac: 'aa:bb:cc:dd:ee:02', name: 'Bedroom' },
    { mac: 'aa:bb:cc:dd:ee:03', name: 'Outside' },
  ],
  macIds: ['aa:bb:cc:dd:ee:01', 'aa:bb:cc:dd:ee:02', 'aa:bb:cc:dd:ee:03'],
}))

// Mock API service
jest.mock('../services/api', () => ({
  fetchHistory: jest.fn(),
}))

/**
 * Helper to wait for loading to complete
 */
const waitForLoadingComplete = async () => {
  await waitFor(() => {
    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument()
  })
}

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }) => (
    <svg data-testid="line-chart" data-points={data?.length || 0}>
      {children}
    </svg>
  ),
  Line: ({ dataKey }) => <line data-testid={`chart-line-${dataKey}`} />,
  XAxis: () => <g data-testid="x-axis" />,
  YAxis: () => <g data-testid="y-axis" />,
  Tooltip: () => <div data-testid="chart-tooltip" />,
  CartesianGrid: () => <g data-testid="cartesian-grid" />,
  ReferenceLine: () => <line data-testid="reference-line" />,
  Legend: ({ payload }) => (
    <div data-testid="chart-legend">
      {payload?.map((entry) => (
        <span key={entry.value}>{entry.value}</span>
      ))}
    </div>
  ),
}))

describe('HistoryScreen', () => {
  const mockHistoryData = [
    {
      timestamp: 1700000000000,
      temperature: 20.5,
      humidity: 45,
      pressure: 1013,
    },
    {
      timestamp: 1700003600000,
      temperature: 21.0,
      humidity: 46,
      pressure: 1014,
    },
    {
      timestamp: 1700007200000,
      temperature: 21.5,
      humidity: 44,
      pressure: 1012,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    apiService.fetchHistory.mockResolvedValue(mockHistoryData)
  })

  describe('Layout', () => {
    it('should render with title', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      expect(
        screen.getByRole('heading', { name: /history/i })
      ).toBeInTheDocument()
    })

    it('should use full viewport height for the container', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      const container = screen.getByTestId('history-screen-container')
      expect(container).toHaveStyle({ height: '100vh' })
    })

    it('should have sensor rows container that grows to fill space', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      const sensorContainer = screen.getByTestId('sensor-rows-container')
      expect(sensorContainer).toHaveStyle({ flex: '1' })
    })

    it('should render time range buttons', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      expect(screen.getByRole('button', { name: '1h' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '6h' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '24h' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '30d' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    })

    it('should have 24h selected by default', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      const button24h = screen.getByRole('button', { name: '24h' })
      expect(button24h).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Time Range Selection', () => {
    it('should update selection when clicking a time range button', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      const button7d = screen.getByRole('button', { name: '7d' })
      fireEvent.click(button7d)

      await waitForLoadingComplete()

      expect(button7d).toHaveAttribute('aria-pressed', 'true')

      // Previous selection should be deselected
      const button24h = screen.getByRole('button', { name: '24h' })
      expect(button24h).toHaveAttribute('aria-pressed', 'false')
    })

    it('should allow selecting different time ranges', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      // Click through all time ranges
      const timeRanges = ['1h', '6h', '24h', '7d', '30d', 'All']

      // Test first range
      const button1h = screen.getByRole('button', { name: timeRanges[0] })
      fireEvent.click(button1h)
      await waitForLoadingComplete()
      expect(button1h).toHaveAttribute('aria-pressed', 'true')

      // Test last range
      const buttonAll = screen.getByRole('button', { name: 'All' })
      fireEvent.click(buttonAll)
      await waitForLoadingComplete()
      expect(buttonAll).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Sensor List', () => {
    it('should render sensor list for each configured sensor', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      expect(screen.getByText('Living Room')).toBeInTheDocument()
      expect(screen.getByText('Bedroom')).toBeInTheDocument()
      expect(screen.getByText('Outside')).toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('should call history API on screen mount', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      expect(apiService.fetchHistory).toHaveBeenCalled()
    })

    it('should call API for all configured sensors', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      expect(apiService.fetchHistory).toHaveBeenCalledWith(
        'aa:bb:cc:dd:ee:01',
        '24h'
      )
      expect(apiService.fetchHistory).toHaveBeenCalledWith(
        'aa:bb:cc:dd:ee:02',
        '24h'
      )
      expect(apiService.fetchHistory).toHaveBeenCalledWith(
        'aa:bb:cc:dd:ee:03',
        '24h'
      )
    })

    it('should call API with correct range parameter', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      // Clear mocks and change range
      apiService.fetchHistory.mockClear()

      const button7d = screen.getByRole('button', { name: '7d' })
      fireEvent.click(button7d)

      await waitForLoadingComplete()

      expect(apiService.fetchHistory).toHaveBeenCalledWith(
        expect.any(String),
        '7d'
      )
    })

    it('should update data when time range changes', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      const initialCallCount = apiService.fetchHistory.mock.calls.length

      // Change time range
      const button1h = screen.getByRole('button', { name: '1h' })
      fireEvent.click(button1h)

      await waitForLoadingComplete()

      expect(apiService.fetchHistory.mock.calls.length).toBeGreaterThan(
        initialCallCount
      )
    })
  })

  describe('Loading State', () => {
    it('should display loading state while fetching', () => {
      // Create a promise that doesn't resolve immediately
      apiService.fetchHistory.mockImplementation(() => new Promise(() => {}))

      renderWithProviders(<HistoryScreen />)

      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
    })

    it('should hide loading state after data loads', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error state on API failure', async () => {
      apiService.fetchHistory.mockRejectedValue(new Error('Network error'))

      renderWithProviders(<HistoryScreen />)

      await waitFor(() => {
        expect(screen.getByTestId('error-alert')).toBeInTheDocument()
      })
    })

    it('should show error message text', async () => {
      apiService.fetchHistory.mockRejectedValue(new Error('Network error'))

      renderWithProviders(<HistoryScreen />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
      })
    })
  })

  describe('Detail Chart', () => {
    it('should show detail chart when sensor is selected', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      // Click on a sensor row
      const sensorRow = screen.getByRole('button', {
        name: /Living Room/i,
      })
      fireEvent.click(sensorRow)

      expect(screen.getByTestId('detail-chart-wrapper')).toBeInTheDocument()
    })
  })

  describe('Metric Selection', () => {
    it('should render metric checkboxes', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/humidity/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/pressure/i)).toBeInTheDocument()
    })

    it('should have temperature selected by default', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      const tempCheckbox = screen.getByLabelText(/temperature/i)
      expect(tempCheckbox).toBeChecked()
    })

    it('should allow selecting multiple metrics', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      const tempCheckbox = screen.getByLabelText(/temperature/i)
      const humidityCheckbox = screen.getByLabelText(/humidity/i)

      // Temperature is checked by default
      expect(tempCheckbox).toBeChecked()

      // Click humidity to add it
      fireEvent.click(humidityCheckbox)

      // Both should be checked now
      expect(tempCheckbox).toBeChecked()
      expect(humidityCheckbox).toBeChecked()
    })

    it('should allow deselecting a metric when multiple are selected', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      const tempCheckbox = screen.getByLabelText(/temperature/i)
      const humidityCheckbox = screen.getByLabelText(/humidity/i)

      // Add humidity first
      fireEvent.click(humidityCheckbox)

      // Remove temperature
      fireEvent.click(tempCheckbox)

      expect(tempCheckbox).not.toBeChecked()
      expect(humidityCheckbox).toBeChecked()
    })

    it('should not allow deselecting the last metric', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      const tempCheckbox = screen.getByLabelText(/temperature/i)

      // Try to deselect temperature (the only selected metric)
      fireEvent.click(tempCheckbox)

      // Should still be checked
      expect(tempCheckbox).toBeChecked()
    })
  })

  describe('Sensor Selection', () => {
    it('should show chart when sensor row is clicked', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      // Click on a sensor row
      const sensorRow = screen.getByRole('button', {
        name: /Living Room/i,
      })
      fireEvent.click(sensorRow)

      expect(screen.getByTestId('detail-chart-wrapper')).toBeInTheDocument()
    })

    it('should hide chart when same sensor row is clicked again', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      const sensorRow = screen.getByRole('button', {
        name: /Living Room/i,
      })

      // Click to select
      fireEvent.click(sensorRow)
      expect(screen.getByTestId('detail-chart-wrapper')).toBeInTheDocument()

      // Click again to deselect
      fireEvent.click(sensorRow)
      expect(
        screen.queryByTestId('detail-chart-wrapper')
      ).not.toBeInTheDocument()
    })

    it('should hide chart when no sensor is selected', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      // Initially no sensor selected, no chart
      expect(
        screen.queryByTestId('detail-chart-wrapper')
      ).not.toBeInTheDocument()
    })

    it('should show sensor name as chart title when selected', async () => {
      renderWithProviders(<HistoryScreen />)
      await waitForLoadingComplete()

      const sensorRow = screen.getByRole('button', {
        name: /Living Room/i,
      })
      fireEvent.click(sensorRow)

      // Living Room appears twice: once in sensor list row, once as chart title
      const livingRoomElements = screen.getAllByText('Living Room')
      expect(livingRoomElements.length).toBe(2)
    })
  })
})
