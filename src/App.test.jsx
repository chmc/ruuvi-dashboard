import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

// Mock the screen components
jest.mock(
  './screens/DashboardScreen',
  () =>
    function MockDashboardScreen() {
      return <div data-testid="dashboard-screen">Dashboard Screen</div>
    }
)

jest.mock(
  './screens/HistoryScreen',
  () =>
    function MockHistoryScreen() {
      return <div data-testid="history-screen">History Screen</div>
    }
)

jest.mock(
  './screens/DiagnosticsScreen',
  () =>
    function MockDiagnosticsScreen() {
      return <div data-testid="diagnostics-screen">Diagnostics Screen</div>
    }
)

jest.mock(
  './components/NavigationFab',
  () =>
    function MockNavigationFab() {
      return <div data-testid="navigation-fab">Navigation FAB</div>
    }
)

describe('App', () => {
  it('should render Dashboard at root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument()
  })

  it('should render History screen at /history route', () => {
    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByTestId('history-screen')).toBeInTheDocument()
  })

  it('should render Diagnostics screen at /diagnostics route', () => {
    render(
      <MemoryRouter initialEntries={['/diagnostics']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByTestId('diagnostics-screen')).toBeInTheDocument()
  })

  it('should redirect unknown routes to Dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument()
  })
})
