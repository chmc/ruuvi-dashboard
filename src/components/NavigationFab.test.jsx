import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import NavigationFab from './NavigationFab'

// Helper component to check current location
const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

// Helper to render with router
const renderWithRouter = (initialRoute = '/') =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <NavigationFab />
      <LocationDisplay />
    </MemoryRouter>
  )

describe('NavigationFab', () => {
  it('should render SpeedDial in bottom-left corner', () => {
    renderWithRouter()

    const speedDial = screen.getByRole('button', { name: /open navigation/i })
    expect(speedDial).toBeInTheDocument()

    // Check that the SpeedDial container has fixed positioning
    const speedDialRoot = speedDial.closest('.MuiSpeedDial-root')
    expect(speedDialRoot).toHaveStyle({
      position: 'fixed',
      bottom: '16px',
      left: '16px',
    })
  })

  it('should open menu when clicking SpeedDial', async () => {
    renderWithRouter()

    const speedDial = screen.getByRole('button', { name: /open navigation/i })
    fireEvent.click(speedDial)

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /dashboard/i })).toBeVisible()
      expect(screen.getByRole('menuitem', { name: /history/i })).toBeVisible()
      expect(
        screen.getByRole('menuitem', { name: /diagnostics/i })
      ).toBeVisible()
    })
  })

  it('should show three navigation options', async () => {
    renderWithRouter()

    const speedDial = screen.getByRole('button', { name: /open navigation/i })
    fireEvent.click(speedDial)

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems).toHaveLength(3)
    })
  })

  it('should navigate to Dashboard when clicking Dashboard option', async () => {
    renderWithRouter('/history')

    const speedDial = screen.getByRole('button', { name: /open navigation/i })
    fireEvent.click(speedDial)

    await waitFor(() => {
      const dashboardAction = screen.getByRole('menuitem', {
        name: /dashboard/i,
      })
      fireEvent.click(dashboardAction)
    })

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/')
    })
  })

  it('should navigate to History when clicking History option', async () => {
    renderWithRouter('/')

    const speedDial = screen.getByRole('button', { name: /open navigation/i })
    fireEvent.click(speedDial)

    await waitFor(() => {
      const historyAction = screen.getByRole('menuitem', { name: /history/i })
      fireEvent.click(historyAction)
    })

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/history')
    })
  })

  it('should navigate to Diagnostics when clicking Diagnostics option', async () => {
    renderWithRouter('/')

    const speedDial = screen.getByRole('button', { name: /open navigation/i })
    fireEvent.click(speedDial)

    await waitFor(() => {
      const diagnosticsAction = screen.getByRole('menuitem', {
        name: /diagnostics/i,
      })
      fireEvent.click(diagnosticsAction)
    })

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/diagnostics')
    })
  })

  it('should close menu after selecting an option', async () => {
    renderWithRouter()

    const speedDial = screen.getByRole('button', { name: /open navigation/i })
    fireEvent.click(speedDial)

    await waitFor(() => {
      const historyAction = screen.getByRole('menuitem', { name: /history/i })
      fireEvent.click(historyAction)
    })

    // After navigation, menu should close
    await waitFor(() => {
      expect(
        screen.queryByRole('menuitem', { name: /dashboard/i })
      ).not.toBeVisible()
    })
  })
})
