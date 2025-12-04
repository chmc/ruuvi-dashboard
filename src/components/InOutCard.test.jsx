import { render, screen } from '@testing-library/react'
import InOutCard from './InOutCard'

// Mock configs
jest.mock('../configs', () => ({
  mainIndoorMac: 'indoor-mac',
  mainOutdoorMac: 'outdoor-mac',
}))

// Mock formatters
jest.mock('../utils/formatters', () => ({
  toTemperatureUI: jest.fn((temp) => (temp ? temp.toFixed(1) : '-')),
  toShortTimeUI: jest.fn(
    (date) =>
      `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  ),
}))

describe('InOutCard', () => {
  const sunrise = new Date('2023-10-24T07:30:00')
  const sunset = new Date('2023-10-24T18:15:00')

  const defaultProps = {
    ruuviDatas: null,
    todayMinMaxTemperature: null,
    sunrise,
    sunset,
  }

  it('should return null when ruuviDatas is null', () => {
    const { container } = render(<InOutCard {...defaultProps} />)

    expect(container.firstChild).toBeNull()
  })

  it('should render indoor and outdoor labels', () => {
    const props = {
      ...defaultProps,
      ruuviDatas: {
        'indoor-mac': { temperature: 22.5, humidity: 45, pressure: 1013 },
        'outdoor-mac': { temperature: 15.2, humidity: 65, pressure: 1010 },
      },
    }

    render(<InOutCard {...props} />)

    expect(screen.getByText('Sisällä')).toBeInTheDocument()
    expect(screen.getByText('Ulkona')).toBeInTheDocument()
  })

  it('should render indoor temperature', () => {
    const props = {
      ...defaultProps,
      ruuviDatas: {
        'indoor-mac': { temperature: 22.5, humidity: 45, pressure: 1013 },
        'outdoor-mac': { temperature: 15.2, humidity: 65, pressure: 1010 },
      },
    }

    render(<InOutCard {...props} />)

    expect(screen.getByText('22.5')).toBeInTheDocument()
  })

  it('should render outdoor temperature', () => {
    const props = {
      ...defaultProps,
      ruuviDatas: {
        'indoor-mac': { temperature: 22.5, humidity: 45, pressure: 1013 },
        'outdoor-mac': { temperature: 15.2, humidity: 65, pressure: 1010 },
      },
    }

    render(<InOutCard {...props} />)

    expect(screen.getByText('15.2')).toBeInTheDocument()
  })

  it('should render sunrise and sunset times', () => {
    const props = {
      ...defaultProps,
      ruuviDatas: {
        'indoor-mac': { temperature: 22.5, humidity: 45, pressure: 1013 },
        'outdoor-mac': { temperature: 15.2, humidity: 65, pressure: 1010 },
      },
    }

    render(<InOutCard {...props} />)

    expect(screen.getByText('7:30')).toBeInTheDocument()
    expect(screen.getByText('18:15')).toBeInTheDocument()
  })

  it('should render min/max temperatures when available', () => {
    const props = {
      ...defaultProps,
      ruuviDatas: {
        'indoor-mac': { temperature: 22.5, humidity: 45, pressure: 1013 },
        'outdoor-mac': { temperature: 15.2, humidity: 65, pressure: 1010 },
      },
      todayMinMaxTemperature: {
        date: new Date('2023-10-24'),
        minTemperature: 10.5,
        maxTemperature: 18.3,
      },
    }

    render(<InOutCard {...props} />)

    expect(screen.getByText('10.5')).toBeInTheDocument()
    expect(screen.getByText('18.3')).toBeInTheDocument()
  })

  it('should not render min/max temperatures when not available', () => {
    const props = {
      ...defaultProps,
      ruuviDatas: {
        'indoor-mac': { temperature: 22.5, humidity: 45, pressure: 1013 },
        'outdoor-mac': { temperature: 15.2, humidity: 65, pressure: 1010 },
      },
      todayMinMaxTemperature: null,
    }

    render(<InOutCard {...props} />)

    // Only the current temperatures should be shown, not min/max
    const temperatures = screen.getAllByText(/^\d+\.\d$/)
    expect(temperatures).toHaveLength(2) // indoor and outdoor only
  })

  it('should handle missing indoor sensor data', () => {
    const props = {
      ...defaultProps,
      ruuviDatas: {
        'outdoor-mac': { temperature: 15.2, humidity: 65, pressure: 1010 },
      },
    }

    render(<InOutCard {...props} />)

    expect(screen.getByText('Sisällä')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument() // Dash for missing data
  })

  it('should handle missing outdoor sensor data', () => {
    const props = {
      ...defaultProps,
      ruuviDatas: {
        'indoor-mac': { temperature: 22.5, humidity: 45, pressure: 1013 },
      },
    }

    render(<InOutCard {...props} />)

    expect(screen.getByText('Ulkona')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument() // Dash for missing data
  })
})
