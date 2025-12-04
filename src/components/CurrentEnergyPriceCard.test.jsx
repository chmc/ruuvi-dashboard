import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CurrentEnergyPriceCard from './CurrentEnergyPriceCard'

// Mock energyPriceColor
jest.mock('../utils/energyPriceColor', () => ({
  getByPrice: jest.fn((price) => {
    if (price <= 5) return '#00ff00'
    if (price <= 10) return '#ffff00'
    return '#ff0000'
  }),
}))

const theme = createTheme({
  palette: {
    energyPriceColors: {
      color1: { main: '#00ff00' },
      color2: { main: '#80ff00' },
      color3: { main: '#ffff00' },
      color4: { main: '#ff8000' },
      color5: { main: '#ff0000' },
      color6: { main: '#800000' },
    },
  },
})

const renderWithTheme = (component) =>
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

describe('CurrentEnergyPriceCard', () => {
  beforeEach(() => {
    // Mock current time to 14:00
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-10-24T14:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return null when energyPrices is null', () => {
    const { container } = renderWithTheme(
      <CurrentEnergyPriceCard energyPrices={null} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should return null when energyPrices is undefined', () => {
    const { container } = renderWithTheme(
      <CurrentEnergyPriceCard energyPrices={undefined} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should display current hour price', () => {
    const energyPrices = [
      { hour: 13, price: 4.5 },
      { hour: 14, price: 5.8 },
      { hour: 15, price: 6.2 },
    ]

    renderWithTheme(<CurrentEnergyPriceCard energyPrices={energyPrices} />)

    expect(screen.getByText('5.8')).toBeInTheDocument()
  })

  it('should display next hour price', () => {
    const energyPrices = [
      { hour: 14, price: 5.8 },
      { hour: 15, price: 6.2 },
      { hour: 16, price: 7.0 },
    ]

    renderWithTheme(<CurrentEnergyPriceCard energyPrices={energyPrices} />)

    expect(screen.getByText(/15\.00: 6\.2 c\/kWh/)).toBeInTheDocument()
  })

  it('should display c/kWh unit', () => {
    const energyPrices = [
      { hour: 14, price: 5.8 },
      { hour: 15, price: 6.2 },
    ]

    renderWithTheme(<CurrentEnergyPriceCard energyPrices={energyPrices} />)

    expect(screen.getByText('c/kWh')).toBeInTheDocument()
  })

  it('should handle midnight rollover for next hour', () => {
    // Set time to 23:00
    jest.setSystemTime(new Date('2023-10-24T23:00:00'))

    const energyPrices = [
      { hour: 23, price: 3.5 },
      { hour: 0, price: 2.8 },
    ]

    renderWithTheme(<CurrentEnergyPriceCard energyPrices={energyPrices} />)

    // Current price should be at hour 23
    expect(screen.getByText('3.5')).toBeInTheDocument()
    // Next hour should be 0:00
    expect(screen.getByText(/0\.00: 2\.8 c\/kWh/)).toBeInTheDocument()
  })

  it('should handle low prices (green color)', () => {
    const energyPrices = [
      { hour: 14, price: 3.0 },
      { hour: 15, price: 4.0 },
    ]

    renderWithTheme(<CurrentEnergyPriceCard energyPrices={energyPrices} />)

    const priceElement = screen.getByText('3')
    expect(priceElement).toBeInTheDocument()
  })

  it('should handle high prices', () => {
    const energyPrices = [
      { hour: 14, price: 25.5 },
      { hour: 15, price: 22.0 },
    ]

    renderWithTheme(<CurrentEnergyPriceCard energyPrices={energyPrices} />)

    expect(screen.getByText('25.5')).toBeInTheDocument()
  })
})
