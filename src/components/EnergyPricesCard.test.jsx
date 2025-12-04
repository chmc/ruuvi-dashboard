import { render, screen, fireEvent } from '@testing-library/react'
import EnergyPricesCard from './EnergyPricesCard'

// Mock VerticalBarChart to simplify testing
jest.mock('./VerticalBarChart', () => {
  return function MockVerticalBarChart({ title, dataset, labels, headerControls }) {
    return (
      <div data-testid="vertical-bar-chart">
        <div data-testid="chart-title">{title}</div>
        <div data-testid="chart-dataset">{JSON.stringify(dataset)}</div>
        <div data-testid="chart-labels">{JSON.stringify(labels)}</div>
        <div data-testid="chart-controls">{headerControls}</div>
      </div>
    )
  }
})

describe('EnergyPricesCard', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-10-24T10:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const defaultProps = {
    title: 'Energy Prices Today',
    noPricesText: 'No prices available',
    energyPrices: null,
  }

  it('should display no prices text when energyPrices is null', () => {
    render(<EnergyPricesCard {...defaultProps} />)

    expect(screen.getByText('No prices available')).toBeInTheDocument()
  })

  it('should display no prices text when energyPrices is undefined', () => {
    render(<EnergyPricesCard {...defaultProps} energyPrices={undefined} />)

    expect(screen.getByText('No prices available')).toBeInTheDocument()
  })

  it('should render chart with title when prices available', () => {
    const energyPrices = [
      { hour: 0, price: 5.0, date: '2023-10-24T00:00:00' },
      { hour: 1, price: 4.5, date: '2023-10-24T01:00:00' },
    ]

    render(<EnergyPricesCard {...defaultProps} energyPrices={energyPrices} />)

    expect(screen.getByTestId('chart-title')).toHaveTextContent('Energy Prices Today')
  })

  it('should render resolution toggle buttons', () => {
    const energyPrices = [
      { hour: 0, price: 5.0, date: '2023-10-24T00:00:00' },
    ]

    render(<EnergyPricesCard {...defaultProps} energyPrices={energyPrices} />)

    expect(screen.getByRole('button', { name: '1 hour resolution' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '15 minute resolution' })).toBeInTheDocument()
  })

  it('should aggregate to hourly averages by default (1h resolution)', () => {
    const energyPrices = [
      { hour: 0, price: 4.0, date: '2023-10-24T00:00:00' },
      { hour: 0, price: 5.0, date: '2023-10-24T00:15:00' },
      { hour: 0, price: 6.0, date: '2023-10-24T00:30:00' },
      { hour: 0, price: 5.0, date: '2023-10-24T00:45:00' },
    ]

    render(<EnergyPricesCard {...defaultProps} energyPrices={energyPrices} />)

    // Average of 4, 5, 6, 5 = 5
    const datasetElement = screen.getByTestId('chart-dataset')
    expect(datasetElement).toHaveTextContent('[5]')
  })

  it('should show time range buttons when 15min resolution is selected', () => {
    const energyPrices = [
      { hour: 0, price: 5.0, date: '2023-10-24T00:00:00' },
    ]

    render(<EnergyPricesCard {...defaultProps} energyPrices={energyPrices} />)

    // Click 15min button
    fireEvent.click(screen.getByRole('button', { name: '15 minute resolution' }))

    // Time range buttons should appear
    expect(screen.getByRole('button', { name: 'incoming prices' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'all prices' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '00-12 hours' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '06-18 hours' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '12-24 hours' })).toBeInTheDocument()
  })

  it('should hide time range buttons when switching back to 1h resolution', () => {
    const energyPrices = [
      { hour: 0, price: 5.0, date: '2023-10-24T00:00:00' },
    ]

    render(<EnergyPricesCard {...defaultProps} energyPrices={energyPrices} />)

    // Switch to 15min
    fireEvent.click(screen.getByRole('button', { name: '15 minute resolution' }))
    expect(screen.getByRole('button', { name: 'all prices' })).toBeInTheDocument()

    // Switch back to 1h
    fireEvent.click(screen.getByRole('button', { name: '1 hour resolution' }))
    expect(screen.queryByRole('button', { name: 'all prices' })).not.toBeInTheDocument()
  })

  it('should sort energy prices by date', () => {
    const energyPrices = [
      { hour: 2, price: 6.0, date: '2023-10-24T02:00:00' },
      { hour: 0, price: 4.0, date: '2023-10-24T00:00:00' },
      { hour: 1, price: 5.0, date: '2023-10-24T01:00:00' },
    ]

    render(<EnergyPricesCard {...defaultProps} energyPrices={energyPrices} />)

    const labelsElement = screen.getByTestId('chart-labels')
    expect(labelsElement).toHaveTextContent('[0,1,2]')
  })

  it('should filter incoming prices in 15min mode', () => {
    // Current time is 10:00
    const energyPrices = [
      { hour: 9, price: 4.0, date: '2023-10-24T09:00:00' }, // Past
      { hour: 10, price: 5.0, date: '2023-10-24T10:00:00' }, // Current/future
      { hour: 11, price: 6.0, date: '2023-10-24T11:00:00' }, // Future
    ]

    render(<EnergyPricesCard {...defaultProps} energyPrices={energyPrices} />)

    // Switch to 15min with 'incoming' filter (default)
    fireEvent.click(screen.getByRole('button', { name: '15 minute resolution' }))

    // Should only show future/current prices
    const datasetElement = screen.getByTestId('chart-dataset')
    expect(datasetElement).toHaveTextContent('[5,6]')
  })

  it('should show all prices when "all" filter is selected', () => {
    const energyPrices = [
      { hour: 9, price: 4.0, date: '2023-10-24T09:00:00' },
      { hour: 10, price: 5.0, date: '2023-10-24T10:00:00' },
      { hour: 11, price: 6.0, date: '2023-10-24T11:00:00' },
    ]

    render(<EnergyPricesCard {...defaultProps} energyPrices={energyPrices} />)

    // Switch to 15min
    fireEvent.click(screen.getByRole('button', { name: '15 minute resolution' }))
    // Select 'all'
    fireEvent.click(screen.getByRole('button', { name: 'all prices' }))

    const datasetElement = screen.getByTestId('chart-dataset')
    expect(datasetElement).toHaveTextContent('[4,5,6]')
  })

  it('should filter by hour range 00-12', () => {
    const energyPrices = [
      { hour: 6, price: 4.0, date: '2023-10-24T06:00:00' },
      { hour: 12, price: 5.0, date: '2023-10-24T12:00:00' },
      { hour: 18, price: 6.0, date: '2023-10-24T18:00:00' },
    ]

    render(<EnergyPricesCard {...defaultProps} energyPrices={energyPrices} />)

    // Switch to 15min
    fireEvent.click(screen.getByRole('button', { name: '15 minute resolution' }))
    // Select '00-12'
    fireEvent.click(screen.getByRole('button', { name: '00-12 hours' }))

    // Only hour 6 should be included (12 is excluded as it's >= 12)
    const datasetElement = screen.getByTestId('chart-dataset')
    expect(datasetElement).toHaveTextContent('[4]')
  })

  it('should handle empty energy prices array', () => {
    render(<EnergyPricesCard {...defaultProps} energyPrices={[]} />)

    // Should still render but with empty data
    expect(screen.getByTestId('chart-dataset')).toHaveTextContent('[]')
  })

  it('should not change resolution when clicking the same button', () => {
    const energyPrices = [
      { hour: 0, price: 5.0, date: '2023-10-24T00:00:00' },
    ]

    render(<EnergyPricesCard {...defaultProps} energyPrices={energyPrices} />)

    // Click 1h button (already selected)
    fireEvent.click(screen.getByRole('button', { name: '1 hour resolution' }))

    // Should still be in 1h mode (no time range buttons)
    expect(screen.queryByRole('button', { name: 'all prices' })).not.toBeInTheDocument()
  })
})
