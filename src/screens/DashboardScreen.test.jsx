import { render, screen, waitFor, act } from '@testing-library/react'
import DashboardScreen from './DashboardScreen'

import apiService from '../services/api'

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
  fetchRuuviData: jest.fn(),
  fetchWeatherData: jest.fn(),
  fetchEnergyPrices: jest.fn(),
  fetchMinMaxTemperatures: jest.fn(),
  fetchTrends: jest.fn(),
}))

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()

    // Setup default mock responses
    apiService.fetchRuuviData.mockResolvedValue({
      mac1: { temperature: 22.5, humidity: 45, pressure: 1013 },
      mac2: { temperature: 15.0, humidity: 60, pressure: 1010 },
    })

    apiService.fetchWeatherData.mockResolvedValue({
      dailyForecast: [],
      hourlyForecast: [],
    })

    apiService.fetchEnergyPrices.mockResolvedValue({
      todayEnergyPrices: [{ hour: 0, price: 5.0 }],
      tomorrowEnergyPrices: [{ hour: 0, price: 6.0 }],
    })

    apiService.fetchMinMaxTemperatures.mockResolvedValue({
      date: '2023-10-24',
      minTemperature: 10.0,
      maxTemperature: 20.0,
    })

    apiService.fetchTrends.mockResolvedValue([
      {
        mac: 'mac1',
        temperature: { direction: 'stable', delta: 0.2 },
        humidity: { direction: 'stable', delta: 0.5 },
      },
      {
        mac: 'mac2',
        temperature: { direction: 'rising', delta: 1.0 },
        humidity: { direction: 'falling', delta: -2.0 },
      },
    ])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render main layout components', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('in-out-card')).toBeInTheDocument()
    })
  })

  it('should fetch ruuvi data on mount', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(apiService.fetchRuuviData).toHaveBeenCalledTimes(1)
    })
  })

  it('should fetch weather data on mount', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(apiService.fetchWeatherData).toHaveBeenCalledTimes(1)
    })
  })

  it('should fetch energy prices on mount', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(apiService.fetchEnergyPrices).toHaveBeenCalledTimes(1)
    })
  })

  it('should fetch min/max temperatures on mount', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(apiService.fetchMinMaxTemperatures).toHaveBeenCalledTimes(1)
    })
  })

  it('should render RuuviCards for each configured sensor', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      const ruuviCards = screen.getAllByTestId('ruuvi-card')
      expect(ruuviCards).toHaveLength(2)
      expect(screen.getByText('Living Room')).toBeInTheDocument()
      expect(screen.getByText('Bedroom')).toBeInTheDocument()
    })
  })

  it('should render energy prices cards with correct titles', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      const energyCards = screen.getAllByTestId('energy-prices-card')
      expect(energyCards).toHaveLength(2)
    })
  })

  it('should render weather forecast card', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('weather-forecast-card')).toBeInTheDocument()
    })
  })

  it('should render current energy price card', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(
        screen.getByTestId('current-energy-price-card')
      ).toBeInTheDocument()
    })
  })

  it('should poll ruuvi data every 10 seconds', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    // Wait for initial fetch
    await waitFor(() => {
      expect(apiService.fetchRuuviData).toHaveBeenCalledTimes(1)
    })

    // Advance timer by 10 seconds
    await act(async () => {
      jest.advanceTimersByTime(10000)
    })

    await waitFor(() => {
      expect(apiService.fetchRuuviData).toHaveBeenCalledTimes(2)
    })

    // Advance another 10 seconds
    await act(async () => {
      jest.advanceTimersByTime(10000)
    })

    await waitFor(() => {
      expect(apiService.fetchRuuviData).toHaveBeenCalledTimes(3)
    })
  })

  it('should poll energy prices every 30 minutes', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    // Wait for initial fetch
    await waitFor(() => {
      expect(apiService.fetchEnergyPrices).toHaveBeenCalledTimes(1)
    })

    // Advance timer by 30 minutes
    await act(async () => {
      jest.advanceTimersByTime(30 * 60 * 1000)
    })

    await waitFor(() => {
      expect(apiService.fetchEnergyPrices).toHaveBeenCalledTimes(2)
    })
  })

  it('should handle ruuvi data fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    apiService.fetchRuuviData.mockRejectedValue(new Error('Network error'))

    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'fetchRuuviData ERROR: ',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })

  it('should handle weather data fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    apiService.fetchWeatherData.mockRejectedValue(new Error('API error'))

    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'fetchWeatherData ERROR: ',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })

  it('should handle energy prices fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    apiService.fetchEnergyPrices.mockRejectedValue(new Error('API error'))

    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'fetchEnergyPrices ERROR: ',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })

  it('should handle min/max temperatures fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    apiService.fetchMinMaxTemperatures.mockRejectedValue(new Error('API error'))

    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'fetchMinMaxTemperatures ERROR: ',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })

  it('should cleanup intervals on unmount', async () => {
    let unmount
    await act(async () => {
      const result = render(<DashboardScreen />)
      unmount = result.unmount
    })

    // Clear initial calls
    jest.clearAllMocks()

    // Unmount the component
    await act(async () => {
      unmount()
    })

    // Advance timers
    await act(async () => {
      jest.advanceTimersByTime(10000)
    })

    // No new calls should be made after unmount
    expect(apiService.fetchRuuviData).not.toHaveBeenCalled()
  })

  it('should fetch trends data on mount', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(apiService.fetchTrends).toHaveBeenCalledTimes(1)
      expect(apiService.fetchTrends).toHaveBeenCalledWith(['mac1', 'mac2'])
    })
  })

  it('should poll trends data every 5 minutes', async () => {
    await act(async () => {
      render(<DashboardScreen />)
    })

    // Wait for initial fetch
    await waitFor(() => {
      expect(apiService.fetchTrends).toHaveBeenCalledTimes(1)
    })

    // Advance timer by 5 minutes
    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000)
    })

    await waitFor(() => {
      expect(apiService.fetchTrends).toHaveBeenCalledTimes(2)
    })
  })

  it('should handle trends fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    apiService.fetchTrends.mockRejectedValue(new Error('Trends API error'))

    await act(async () => {
      render(<DashboardScreen />)
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'fetchTrends ERROR: ',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })
})
