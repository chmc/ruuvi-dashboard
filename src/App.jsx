import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardScreen from './screens/DashboardScreen'
import HistoryScreen from './screens/HistoryScreen'
import DiagnosticsScreen from './screens/DiagnosticsScreen'
import NavigationFab from './components/NavigationFab'
import ErrorBoundary from './components/ErrorBoundary'

/**
 * Main App component with routing
 * @returns {JSX.Element}
 */
const App = () => (
  <ErrorBoundary>
    <Routes>
      <Route path="/" element={<DashboardScreen />} />
      <Route path="/history" element={<HistoryScreen />} />
      <Route path="/diagnostics" element={<DiagnosticsScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <NavigationFab />
  </ErrorBoundary>
)

export default App
