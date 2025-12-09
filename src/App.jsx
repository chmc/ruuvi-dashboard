import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardScreen from './screens/DashboardScreen'
import HistoryScreen from './screens/HistoryScreen'
import DiagnosticsScreen from './screens/DiagnosticsScreen'
import NavigationFab from './components/NavigationFab'
import ErrorBoundary from './components/ErrorBoundary'
import { ChartConfigProvider } from './contexts/ChartConfigContext'

/**
 * Main App component with routing
 * @returns {JSX.Element}
 */
const App = () => (
  <ErrorBoundary>
    <ChartConfigProvider>
      <Routes>
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/diagnostics" element={<DiagnosticsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <NavigationFab />
    </ChartConfigProvider>
  </ErrorBoundary>
)

export default App
