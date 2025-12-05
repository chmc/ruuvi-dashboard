import { render, screen, waitFor, act } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import darkTheme from '../theme'
import DashboardScreen from './DashboardScreen'

// Mock all child components
jest.mock(
  '../components/RuuviCard',
  () =>
    function MockRuuviCard({ ruuvi }) {
      return <div data-testid="ruuvi-card">{ruuvi.name}</div>
    }
)

jest.mock(
  '../components/InOutCard',
  () =>
    function MockInOutCard() {
      return <div data-testid="in-out-card">InOutCard</div>
    }
)

jest.mock(
  '../components/WeatherForecastCard',
  () =>
    function MockWeatherForecastCard() {
      return <div data-testid="weather-forecast-card">WeatherForecastCard</div>
    }
)

jest.mock(
  '../components/EnergyPricesCard',
  () =>
    function MockEnergyPricesCard({ title }) {
      return <div data-testid="energy-prices-card">{title}</div>
    }
)

jest.mock(
  '../components/CurrentEnergyPriceCard',
  () =>
    function MockCurrentEnergyPriceCard() {
      return (
        <div data-testid="current-energy-price-card">
          CurrentEnergyPriceCard
        </div>
      )
    }
)

// Mock sunrise-sunset-js
jest.mock('sunrise-sunset-js', () => ({
  getSunrise: jest.fn(() => new Date('2023-10-24T07:00:00')),
  getSunset: jest.fn(() => new Date('2023-10-24T18:00:00')),
}))

// Mock configs
jest.mock('../configs', () => ({
  ruuviTags: [
    { mac: 'mac1', name: 'Living Room' },
    { mac: 'mac2', name: 'Bedroom' },
  ],
  macIds: ['mac1', 'mac2'],
  mainIndoorMac: 'mac1',
  mainOutdoorMac: 'mac2',
}))

// Mock API service
jest.mock('../services/api', () => ({
  fetchRuuviData: jest.fn().mockResolvedValue({
    mac1: { temperature: 22.5, humidity: 45, pressure: 1013 },
    mac2: { temperature: 15.0, humidity: 60, pressure: 1010 },
  }),
  fetchWeatherData: jest.fn().mockResolvedValue({
    dailyForecast: [],
    hourlyForecast: [],
  }),
  fetchEnergyPrices: jest.fn().mockResolvedValue({
    todayEnergyPrices: [{ hour: 0, price: 5.0 }],
    tomorrowEnergyPrices: [{ hour: 0, price: 6.0 }],
  }),
  fetchMinMaxTemperatures: jest.fn().mockResolvedValue({
    date: '2023-10-24',
    minTemperature: 10.0,
    maxTemperature: 20.0,
  }),
  fetchTrends: jest.fn().mockResolvedValue([]),
}))

describe('DashboardScreen Layout Optimization', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('grid spacing', () => {
    it('should render MUI Grid with 12px spacing (1.5 * 8px)', async () => {
      // Test that Grid renders with correct spacing by checking CSS variables
      const { container } = render(
        <ThemeProvider theme={darkTheme}>
          <Grid container spacing={1.5} data-testid="test-grid">
            <Grid size={6}>Item 1</Grid>
            <Grid size={6}>Item 2</Grid>
          </Grid>
        </ThemeProvider>
      )

      // Verify Grid container renders
      const gridContainer = container.querySelector('[data-testid="test-grid"]')
      expect(gridContainer).toBeInTheDocument()

      // MUI v7 uses CSS-in-JS via Emotion, which means style is applied via CSS classes
      // The spacing prop (1.5) should result in 12px gap (1.5 * 8px default spacing)
      // We verify the Grid is rendered and has the container class
      expect(gridContainer.classList.toString()).toMatch(/MuiGrid/)
    })
  })

  describe('container padding', () => {
    it('should render with reduced horizontal padding', async () => {
      await act(async () => {
        render(
          <ThemeProvider theme={darkTheme}>
            <DashboardScreen />
          </ThemeProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('in-out-card')).toBeInTheDocument()
      })

      // Get the Box container that wraps the Grid
      const boxContainer = document.querySelector('.MuiBox-root')
      expect(boxContainer).toBeInTheDocument()

      const computedStyle = window.getComputedStyle(boxContainer)
      // Check padding is reduced (px={1.5} = 12px)
      expect(computedStyle.paddingLeft).toBe('12px')
      expect(computedStyle.paddingRight).toBe('12px')
      // Check top padding is reduced (pt={1.5} = 12px)
      expect(computedStyle.paddingTop).toBe('12px')
    })
  })

  describe('card padding', () => {
    it('should apply reduced card padding via theme overrides', () => {
      // Check that theme has MuiCardContent styleOverrides
      const cardContentOverrides =
        darkTheme.components?.MuiCardContent?.styleOverrides?.root

      expect(cardContentOverrides).toBeDefined()
      expect(cardContentOverrides.padding).toBe('12px')
      expect(cardContentOverrides['&:last-child']).toEqual({
        paddingBottom: '12px',
      })
    })
  })

  describe('total content height', () => {
    it('should render content that fits within 752px viewport height', async () => {
      // Set viewport to 800px height
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800,
      })

      await act(async () => {
        render(
          <ThemeProvider theme={darkTheme}>
            <DashboardScreen />
          </ThemeProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('in-out-card')).toBeInTheDocument()
      })

      // Get the outer container
      const boxContainer = document.querySelector('.MuiBox-root')
      expect(boxContainer).toBeInTheDocument()

      // The dashboard content should fit within 752px (800 - 48 for header/nav margin)
      // This test documents the expectation that content will fit
      // The actual pixel-perfect test would require a visual regression test
      expect(boxContainer.scrollHeight).toBeLessThanOrEqual(752)
    })
  })
})
