# Architecture Improvements TODO

> **Rules:**
> - Work on ONE task at a time
> - Follow TDD: Write tests first, then implementation
> - Mark task `[IN PROGRESS]` when starting
> - Mark task `[COMPLETED]` when done
> - Wait for instruction before starting next task

---

## Critical Priority

### 1. Move OpenWeatherMap API to Backend Proxy [COMPLETED]

**Problem:** API key exposed in frontend bundle (`src/services/api.js`)

**Tasks:**
- [x] Create `server/routes/weather.js` with `/api/weather` endpoint
- [x] Add tests for weather route (`server/routes/weather.test.js`)
- [x] Move `VITE_OPENWEATHERMAP_APIKEY` to backend-only env var
- [x] Update `src/services/api.js` to call `/api/weather` instead
- [x] Update frontend tests for new weather API
- [x] Add server-side caching for weather data (30 min TTL)
- [x] Remove `VITE_OPENWEATHERMAP_APIKEY` from frontend configs
- [x] Update `.env.template` documentation

**Files modified:**
- `server/routes/weather.js` (new)
- `server/routes/weather.test.js` (new)
- `server/index.js`
- `src/services/api.js`
- `src/configs.js`
- `.env.template`

---

## High Priority

### 2. Extract Shared Metric Constants [COMPLETED]

**Problem:** METRICS definition duplicated in 4+ files with variations

**Tasks:**
- [x] Create `src/constants/metrics.js` with unified METRICS definition
- [x] Add tests for metrics constants (`src/constants/metrics.test.js`)
- [x] Refactor `src/components/DetailChart.jsx` to use shared constants
- [x] Refactor `src/components/Sparkline.jsx` to use shared constants
- [x] Refactor `src/components/SensorHistoryRow.jsx` to use shared constants
- [x] Refactor `src/screens/HistoryScreen.jsx` to use shared constants
- [x] Update existing component tests

**Files modified:**
- `src/constants/metrics.js` (new)
- `src/constants/metrics.test.js` (new)
- `src/components/DetailChart.jsx`
- `src/components/Sparkline.jsx`
- `src/components/SensorHistoryRow.jsx`
- `src/screens/HistoryScreen.jsx`

---

### 3. Extract Shared Time Range Constants [COMPLETED]

**Problem:** TIME_RANGES and chart time formatting duplicated

**Tasks:**
- [x] Create `src/constants/timeRanges.js` with TIME_RANGES
- [x] Add tests for time range constants
- [x] Create `src/utils/chartFormatters.js` for shared time formatting
- [x] Add tests for chart formatters
- [x] Refactor `DetailChart.jsx` to use shared formatters
- [x] Refactor `Sparkline.jsx` to use shared formatters
- [x] Refactor `HistoryScreen.jsx` to use shared TIME_RANGES
- [x] Update existing tests

**Files modified:**
- `src/constants/timeRanges.js` (new)
- `src/constants/timeRanges.test.js` (new)
- `src/utils/chartFormatters.js` (new)
- `src/utils/chartFormatters.test.js` (new)
- `src/components/DetailChart.jsx`
- `src/components/Sparkline.jsx`
- `src/screens/HistoryScreen.jsx`

---

### 4. Extract Shared Sensor Colors [COMPLETED]

**Problem:** SENSOR_COLORS hardcoded in HistoryScreen

**Tasks:**
- [x] Create `src/constants/colors.js` with SENSOR_COLORS
- [x] Add tests for color constants
- [x] Refactor `HistoryScreen.jsx` to use shared colors
- [x] Update tests

**Files modified:**
- `src/constants/colors.js` (new)
- `src/constants/colors.test.js` (new)
- `src/screens/HistoryScreen.jsx`

---

### 5. Standardize Loading States [COMPLETED]

**Problem:** Inconsistent loading UI across screens

**Tasks:**
- [x] Create `src/components/LoadingOverlay.jsx` component
- [x] Add tests for LoadingOverlay
- [x] Apply to `DashboardScreen.jsx` (currently has none)
- [x] Apply to `HistoryScreen.jsx` (replace inline CircularProgress)
- [x] Apply to `DiagnosticsScreen.jsx` (replace inline CircularProgress)
- [x] Update screen tests

**Files modified:**
- `src/components/LoadingOverlay.jsx` (new)
- `src/components/LoadingOverlay.test.jsx` (new)
- `src/screens/DashboardScreen.jsx`
- `src/screens/DashboardScreen.test.jsx`
- `src/screens/HistoryScreen.jsx`
- `src/screens/HistoryScreen.test.jsx`
- `src/screens/DiagnosticsScreen.jsx`

---

### 6. Standardize Error States [COMPLETED]

**Problem:** Inconsistent error handling across screens

**Tasks:**
- [x] Create `src/components/ErrorAlert.jsx` component
- [x] Add tests for ErrorAlert
- [x] Apply to `DashboardScreen.jsx`
- [x] Apply to `HistoryScreen.jsx` (replace inline Alert)
- [x] Apply to `DiagnosticsScreen.jsx`
- [x] Update screen tests

**Files modified:**
- `src/components/ErrorAlert.jsx` (new)
- `src/components/ErrorAlert.test.jsx` (new)
- `src/screens/DashboardScreen.jsx`
- `src/screens/DashboardScreen.test.jsx`
- `src/screens/HistoryScreen.jsx`
- `src/screens/HistoryScreen.test.jsx`
- `src/screens/DiagnosticsScreen.jsx`

---

## Medium Priority

### 7. Add React Error Boundary [COMPLETED]

**Problem:** Component crash takes down entire app

**Tasks:**
- [x] Create `src/components/ErrorBoundary.jsx` class component
- [x] Create `src/components/ErrorFallback.jsx` fallback UI
- [x] Add tests for ErrorBoundary
- [x] Wrap routes in `App.jsx` with ErrorBoundary
- [x] Update App tests

**Files modified:**
- `src/components/ErrorBoundary.jsx` (new)
- `src/components/ErrorFallback.jsx` (new)
- `src/components/ErrorBoundary.test.jsx` (new)
- `src/App.jsx`
- `src/App.test.jsx`

---

### 8. Consolidate Pressure-to-Weather Logic [COMPLETED]

**Problem:** Same logic in RuuviCard.jsx and formatters.js

**Tasks:**
- [x] Update `src/utils/formatters.js` to return structured pressure data
- [x] Add/update tests for pressure formatter
- [x] Refactor `src/components/RuuviCard.jsx` to use formatter + add icons
- [x] Update RuuviCard tests

**Files modified:**
- `src/utils/formatters.js`
- `src/utils/formatters.test.js`
- `src/components/RuuviCard.jsx`
- `src/components/RuuviCard.test.jsx`

---

### 9. Create usePollingData Custom Hook [COMPLETED]

**Problem:** Polling logic duplicated across screens

**Tasks:**
- [x] Create `src/hooks/usePollingData.js` custom hook
- [x] Add comprehensive tests for the hook
- [x] Refactor `DashboardScreen.jsx` to use hook
- [x] Refactor `DiagnosticsScreen.jsx` to use hook
- [x] Update screen tests

**Files modified:**
- `src/hooks/usePollingData.js` (new)
- `src/hooks/usePollingData.test.js` (new)
- `src/screens/DashboardScreen.jsx`
- `src/screens/DiagnosticsScreen.jsx`

---

### 10. Replace Console.log with Structured Logging (Backend) [COMPLETED]

**Problem:** 95 console statements in production code

**Tasks:**
- [x] Add `pino` logger dependency
- [x] Create `server/utils/logger.js` with configured logger
- [x] Add tests for logger configuration
- [x] Replace console.log in `server/index.js`
- [x] Replace console.log in `server/storage.js`
- [x] Replace console.log in `server/services/*.js`
- [x] Replace console.log in `server/routes/*.js`
- [x] Update ESLint rule `no-console` to `error` for server files

**Files modified:**
- `package.json` (add pino)
- `server/utils/logger.js` (new)
- `server/utils/logger.test.js` (new)
- `server/index.js`
- `server/storage.js`
- `server/storage.test.js`
- `server/services/energyPrices.js`
- `server/services/energyPricesFromApi.js`
- `server/services/temperature.js`
- `server/services/ble/bleScanner.js`
- `server/services/history/historyBuffer.js`
- `server/services/history/shutdownHandler.js`
- `server/services/history/shutdownHandler.test.js`
- `server/routes/history.js`
- `server/routes/weather.js`
- `server/routes/trends.js`
- `server/routes/diagnostics.js`
- `eslint.config.js`

---

## Low Priority

### 11. Fix Async Bug in storage.js [COMPLETED]

**Problem:** `loadOrDefault()` uses callback-style but doesn't await properly

**Tasks:**
- [x] Add failing test for `loadOrDefault()` async behavior
- [x] Add failing test for `save()` async behavior
- [x] Fix `loadOrDefault()` using `fs.promises.readFile`
- [x] Fix `save()` using `fs.promises.writeFile`
- [x] Verify tests pass

**Files modified:**
- `server/storage.js`
- `server/storage.test.js`

---

### 12. Create ChartConfigContext [COMPLETED]

**Problem:** Chart colors hardcoded, not theme-aware

**Tasks:**
- [x] Create `src/contexts/ChartConfigContext.jsx`
- [x] Add tests for context
- [x] Provide context in `App.jsx`
- [x] Update chart components to consume context
- [x] Update tests

**Files modified:**
- `src/contexts/ChartConfigContext.jsx` (new)
- `src/contexts/ChartConfigContext.test.jsx` (new)
- `src/App.jsx`
- `src/components/DetailChart.jsx`
- `src/components/DetailChart.test.jsx`
- `src/components/Sparkline.jsx`
- `src/components/Sparkline.test.jsx`
- `src/components/SensorHistoryRow.test.jsx`
- `src/screens/HistoryScreen.test.jsx`

**Note:** EnergyPricesCard.jsx/VerticalBarChart.jsx already uses MUI theme for energy price colors via `theme.palette.energyPriceColors`, so no changes were needed there.

---

### 13. Standardize API Response Envelope [COMPLETED]

**Problem:** Inconsistent API response formats

**Tasks:**
- [x] Create `server/utils/apiResponse.js` helper
- [x] Add tests for response helper
- [x] Update all routes to use standard envelope
- [x] Update frontend to handle new format
- [x] Update all API tests

**Files modified:**
- `server/utils/apiResponse.js` (new)
- `server/utils/apiResponse.test.js` (new)
- `server/index.js`
- `server/routes/weather.js`
- `server/routes/history.js`
- `server/routes/trends.js`
- `server/routes/diagnostics.js`
- `server/routes/weather.test.js`
- `server/routes/history.test.js`
- `server/routes/trends.test.js`
- `server/routes/diagnostics.test.js`
- `src/services/api.js`
- `src/services/api.test.js`

**Standard envelope format:**
```js
// Success
{ success: true, data: <any> }

// Error
{ success: false, error: { message: <string>, code?: <string>, details?: <any> } }
```

---

### 14. Add CORS Configuration [COMPLETED]

**Problem:** No explicit CORS configuration

**Tasks:**
- [x] Add `cors` dependency
- [x] Configure CORS in `server/index.js`
- [x] Add tests for CORS headers
- [x] Document allowed origins in `.env.template`

**Files modified:**
- `package.json`
- `server/index.js`
- `server/middleware/cors.js` (new)
- `server/middleware/cors.test.js` (new)
- `.env.template`

**Configuration:**
- By default, only same-origin requests are allowed (no CORS headers)
- Set `CORS_ALLOWED_ORIGINS` env var with comma-separated origins to allow cross-origin requests
- Example: `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.100:3001`
