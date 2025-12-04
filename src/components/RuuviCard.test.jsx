import { render, screen } from '@testing-library/react'
import RuuviCard from './RuuviCard'

// Mock formatters
jest.mock('../utils/formatters', () => ({
  toTemperatureUI: jest.fn((temp) => (temp ? temp.toFixed(1) : '-')),
  toHumidityUI: jest.fn((hum) => (hum ? Math.round(hum).toString() : '-')),
}))

describe('RuuviCard', () => {
  const defaultProps = {
    ruuvi: { mac: 'aa:bb:cc:dd:ee:ff', name: 'Living Room' },
    ruuviData: null,
  }

  it('should render sensor name', () => {
    render(<RuuviCard {...defaultProps} />)

    expect(screen.getByText('Living Room')).toBeInTheDocument()
  })

  it('should render dash when ruuviData is null', () => {
    render(<RuuviCard {...defaultProps} />)

    expect(screen.getByText(/Asteet: -/)).toBeInTheDocument()
    expect(screen.getByText(/Kosteus: -/)).toBeInTheDocument()
  })

  it('should render temperature and humidity from sensor data', () => {
    const props = {
      ...defaultProps,
      ruuviData: {
        temperature: 21.5,
        humidity: 45.3,
        pressure: 1013,
        mac: 'aa:bb:cc:dd:ee:ff',
      },
    }

    render(<RuuviCard {...props} />)

    expect(screen.getByText(/Asteet: 21.5/)).toBeInTheDocument()
    expect(screen.getByText(/Kosteus: 45/)).toBeInTheDocument()
  })

  it('should display storm weather for very low pressure', () => {
    const props = {
      ...defaultProps,
      ruuviData: {
        temperature: 20,
        humidity: 50,
        pressure: 985,
        mac: 'aa:bb:cc:dd:ee:ff',
      },
    }

    render(<RuuviCard {...props} />)

    expect(screen.getByText('Myrsky')).toBeInTheDocument()
  })

  it('should display rain weather for low pressure', () => {
    const props = {
      ...defaultProps,
      ruuviData: {
        temperature: 20,
        humidity: 50,
        pressure: 1000,
        mac: 'aa:bb:cc:dd:ee:ff',
      },
    }

    render(<RuuviCard {...props} />)

    expect(screen.getByText('Sade')).toBeInTheDocument()
  })

  it('should display cloudy weather for normal pressure', () => {
    const props = {
      ...defaultProps,
      ruuviData: {
        temperature: 20,
        humidity: 50,
        pressure: 1010,
        mac: 'aa:bb:cc:dd:ee:ff',
      },
    }

    render(<RuuviCard {...props} />)

    expect(screen.getByText('Pilvi')).toBeInTheDocument()
  })

  it('should display fair weather for higher pressure', () => {
    const props = {
      ...defaultProps,
      ruuviData: {
        temperature: 20,
        humidity: 50,
        pressure: 1020,
        mac: 'aa:bb:cc:dd:ee:ff',
      },
    }

    render(<RuuviCard {...props} />)

    expect(screen.getByText('Pouta')).toBeInTheDocument()
  })

  it('should display sunny weather for high pressure', () => {
    const props = {
      ...defaultProps,
      ruuviData: {
        temperature: 20,
        humidity: 50,
        pressure: 1030,
        mac: 'aa:bb:cc:dd:ee:ff',
      },
    }

    render(<RuuviCard {...props} />)

    expect(screen.getByText('Aurinko')).toBeInTheDocument()
  })

  it('should handle negative temperatures', () => {
    const props = {
      ...defaultProps,
      ruuviData: {
        temperature: -15.5,
        humidity: 80,
        pressure: 1015,
        mac: 'aa:bb:cc:dd:ee:ff',
      },
    }

    render(<RuuviCard {...props} />)

    expect(screen.getByText(/Asteet: -15.5/)).toBeInTheDocument()
  })
})
