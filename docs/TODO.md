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

### 8. Consolidate Pressure-to-Weather Logic

**Problem:** Same logic in RuuviCard.jsx and formatters.js

**Tasks:**
- [ ] Update `src/utils/formatters.js` to return structured pressure data
- [ ] Add/update tests for pressure formatter
- [ ] Refactor `src/components/RuuviCard.jsx` to use formatter + add icons
- [ ] Update RuuviCard tests

**Files to modify:**
- `src/utils/formatters.js`
- `src/utils/formatters.test.js`
- `src/components/RuuviCard.jsx`
- `src/components/RuuviCard.test.jsx`

---

### 9. Create usePollingData Custom Hook

**Problem:** Polling logic duplicated across screens

**Tasks:**
- [ ] Create `src/hooks/usePollingData.js` custom hook
- [ ] Add comprehensive tests for the hook
- [ ] Refactor `DashboardScreen.jsx` to use hook
- [ ] Refactor `DiagnosticsScreen.jsx` to use hook
- [ ] Update screen tests

**Files to modify:**
- `src/hooks/usePollingData.js` (new)
- `src/hooks/usePollingData.test.js` (new)
- `src/screens/DashboardScreen.jsx`
- `src/screens/DiagnosticsScreen.jsx`

---

### 10. Replace Console.log with Structured Logging (Backend)

**Problem:** 95 console statements in production code

**Tasks:**
- [ ] Add `pino` logger dependency
- [ ] Create `server/utils/logger.js` with configured logger
- [ ] Add tests for logger configuration
- [ ] Replace console.log in `server/index.js`
- [ ] Replace console.log in `server/storage.js`
- [ ] Replace console.log in `server/services/*.js`
- [ ] Replace console.log in `server/routes/*.js`
- [ ] Update ESLint rule `no-console` to `error` for server files

**Files to modify:**
- `package.json` (add pino)
- `server/utils/logger.js` (new)
- `server/index.js`
- `server/storage.js`
- `server/services/*.js` (multiple)
- `server/routes/*.js` (multiple)
- `eslint.config.js`

---

## Low Priority

### 11. Fix Async Bug in storage.js

**Problem:** `loadOrDefault()` uses callback-style but doesn't await properly

**Tasks:**
- [ ] Add failing test for `loadOrDefault()` async behavior
- [ ] Fix using `fs.promises.readFile`
- [ ] Verify test passes

**Files to modify:**
- `server/storage.js`
- `server/storage.test.js`

---

### 12. Create ChartConfigContext

**Problem:** Chart colors hardcoded, not theme-aware

**Tasks:**
- [ ] Create `src/contexts/ChartConfigContext.jsx`
- [ ] Add tests for context
- [ ] Provide context in `App.jsx`
- [ ] Update chart components to consume context
- [ ] Update tests

**Files to modify:**
- `src/contexts/ChartConfigContext.jsx` (new)
- `src/App.jsx`
- `src/components/DetailChart.jsx`
- `src/components/Sparkline.jsx`
- `src/components/EnergyPricesCard.jsx`

---

### 13. Standardize API Response Envelope

**Problem:** Inconsistent API response formats

**Tasks:**
- [ ] Create `server/utils/apiResponse.js` helper
- [ ] Add tests for response helper
- [ ] Update all routes to use standard envelope
- [ ] Update frontend to handle new format
- [ ] Update all API tests

**Files to modify:**
- `server/utils/apiResponse.js` (new)
- `server/routes/*.js` (all)
- `src/services/api.js`

---

### 14. Add CORS Configuration

**Problem:** No explicit CORS configuration

**Tasks:**
- [ ] Add `cors` dependency
- [ ] Configure CORS in `server/index.js`
- [ ] Add tests for CORS headers
- [ ] Document allowed origins in `.env.template`

**Files to modify:**
- `package.json`
- `server/index.js`
- `.env.template`
