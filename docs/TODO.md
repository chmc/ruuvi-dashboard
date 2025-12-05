# RuuviTag Data History & UI Improvements

## Overview

Implement persistent storage for RuuviTag sensor data with history visualization, trend indicators, and a diagnostics screen. Optimize for Raspberry Pi SD card longevity and tablet display (1280×800 fullscreen).

## Rules

- **TDD Principle**: Write tests first, then implement to make tests pass
- **Task Start**: Mark task title as "in progress" when starting implementation
- **Task Complete**: Mark task title as "completed" when finished, wait for user instructions before committing

## Architecture Decisions

| Topic | Decision |
|-------|----------|
| Database | SQLite with WAL mode (`better-sqlite3`) |
| Data Retention | 24h’1min, 7d’5min, 30d+’hourly averages |
| Buffer Flush | 15 minutes interval |
| SD Card Protection | In-memory buffer + optional tmpfs |
| Graceful Shutdown | Signal handlers + systemd hook |
| Seed Data | 90 days via `RUUVI_SEED_HISTORY=true` |
| Charts | Recharts library |
| Navigation | Floating Speed Dial (MUI SpeedDial) |
| Trends | Arrows on dashboard cards, sparklines on history screen |
| Target Device | Lenovo Tab 2 X30L, 1280×800 fullscreen |

## Environment Variables (New)

```bash
# Database
RUUVI_HISTORY_DB_PATH=./server/ruuviHistory.db
RUUVI_SEED_HISTORY=true/false

# SD Card Protection
RUUVI_BUFFER_FLUSH_INTERVAL=900  # Seconds (15 min default)
RUUVI_USE_TMPFS_BUFFER=true/false
RUUVI_TMPFS_PATH=/var/ruuvi-buffer
```

---

## Phase 1: Database Foundation

### Task 1.1: Create SQLite History Service - Schema and Connection

Create the history database service with schema initialization.

**Test first:**
- Test database file creation
- Test schema has correct tables and indexes
- Test WAL mode is enabled
- Test connection opens and closes properly

**Implementation:**
- Create `server/services/history/historyDb.js`
- Schema: `readings` table (id, mac, timestamp, temperature, humidity, pressure, battery)
- Indexes on (mac, timestamp)
- WAL mode and NORMAL synchronous pragma

**Files:** `server/services/history/historyDb.js`, `server/services/history/historyDb.test.js`

---

### Task 1.2: Create History Service - Insert and Query Methods

Add methods to insert readings and query by time range.

**Test first:**
- Test inserting single reading
- Test inserting batch of readings
- Test querying by MAC and time range
- Test querying returns data in correct order (ascending timestamp)
- Test empty result for non-existent MAC

**Implementation:**
- `insertReading(mac, timestamp, temperature, humidity, pressure, battery)`
- `insertBatch(readings[])`
- `getReadings(mac, startTime, endTime)`
- `getLatestReading(mac)`

**Files:** `server/services/history/historyDb.js`, `server/services/history/historyDb.test.js`

---

### Task 1.3: Create In-Memory Buffer Service

Create buffer that accumulates readings before flushing to database.

**Test first:**
- Test adding readings to buffer
- Test buffer returns correct count
- Test flush writes all readings to database
- Test flush clears buffer
- Test getBufferContents returns current readings

**Implementation:**
- Create `server/services/history/historyBuffer.js`
- `addReading(mac, data)` - adds to in-memory Map
- `getBufferSize()` - returns count of buffered readings
- `getBufferContents()` - returns all buffered readings
- `flush(historyDb)` - writes to DB and clears buffer

**Files:** `server/services/history/historyBuffer.js`, `server/services/history/historyBuffer.test.js`

---

### Task 1.4: Create Scheduled Flush Mechanism

Implement automatic buffer flushing at configured interval.

**Test first:**
- Test flush scheduler starts with correct interval
- Test flush scheduler calls flush method
- Test flush scheduler stops properly
- Test interval is configurable via environment variable

**Implementation:**
- Create `server/services/history/flushScheduler.js`
- `start(intervalMs, flushCallback)` - starts setInterval
- `stop()` - clears interval
- `forceFlush()` - immediate flush (for diagnostics)
- Read `RUUVI_BUFFER_FLUSH_INTERVAL` from env

**Files:** `server/services/history/flushScheduler.js`, `server/services/history/flushScheduler.test.js`

---

### Task 1.5: Create Graceful Shutdown Handler

Implement signal handlers to flush buffer before process exit.

**Test first:**
- Test SIGTERM handler is registered
- Test SIGINT handler is registered
- Test handler calls flush before exit
- Test handler logs shutdown message

**Implementation:**
- Create `server/services/history/shutdownHandler.js`
- `register(flushCallback)` - registers signal handlers
- Handle SIGTERM, SIGINT signals
- Log shutdown progress
- Call flush and wait for completion before exit

**Files:** `server/services/history/shutdownHandler.js`, `server/services/history/shutdownHandler.test.js`

---

### Task 1.6: Create Data Retention/Aggregation Service

Implement downsampling of old data to reduce storage.

**Test first:**
- Test aggregation calculates correct averages
- Test data older than 24h is downsampled to 5-min
- Test data older than 7d is downsampled to hourly
- Test original granular data is deleted after aggregation
- Test aggregation is idempotent (safe to run multiple times)

**Implementation:**
- Create `server/services/history/retentionService.js`
- `aggregateOldData(db)` - main aggregation function
- `downsampleTo5Min(db, startTime, endTime)`
- `downsampleToHourly(db, startTime, endTime)`
- Calculate avg temperature, humidity, pressure; min battery

**Files:** `server/services/history/retentionService.js`, `server/services/history/retentionService.test.js`

---

### Task 1.7: Create History Seeder for Development

Generate 90 days of realistic fake history data.

**Test first:**
- Test seeder generates data for all configured MACs
- Test data spans 90 days
- Test temperature follows realistic daily pattern (cooler at night)
- Test outdoor sensor has seasonal/weather variation
- Test seeder only runs when DB is empty and env var is set

**Implementation:**
- Create `server/services/history/historySeeder.js`
- `shouldSeed()` - checks `RUUVI_SEED_HISTORY` env and empty DB
- `seed(db, macs)` - generates 90 days of 1-min data
- Realistic patterns: daily cycle, random variation, outdoor vs indoor

**Files:** `server/services/history/historySeeder.js`, `server/services/history/historySeeder.test.js`

---

### Task 1.8: Integrate History Service with Ruuvi Scanner

Connect the BLE scanner to buffer readings for storage.

**Test first:**
- Test scanner events trigger buffer additions
- Test reading data is correctly formatted for buffer
- Test integration works with simulated scanner
- Test buffer receives readings with correct MAC normalization

**Implementation:**
- Modify `server/index.js` to initialize history services
- Subscribe to scanner events
- Add readings to buffer on each scan
- Initialize DB, buffer, scheduler, shutdown handler on startup

**Files:** `server/index.js`, `server/index.test.js` (integration tests)

---

## Phase 2: History API Endpoints

### Task 2.1: Create History API Endpoint

Add endpoint to fetch historical readings.

**Test first:**
- Test GET `/api/ruuvi/history` returns readings
- Test `mac` query parameter filters by sensor
- Test `range` query parameter filters by time (1h, 6h, 24h, 7d, 30d, all)
- Test response format matches frontend expectations
- Test 400 error for missing mac parameter

**Implementation:**
- Add route `GET /api/ruuvi/history`
- Query params: `mac` (required), `range` (default: 24h)
- Return array of `{ timestamp, temperature, humidity, pressure }`
- Downsample response if too many points (max ~500 points for charts)

**Files:** `server/routes/history.js`, `server/routes/history.test.js`, `server/index.js`

---

### Task 2.2: Create Trends API Endpoint

Add endpoint to fetch trend data for dashboard arrows.

**Test first:**
- Test GET `/api/ruuvi/trends` returns trend for each sensor
- Test trend calculates direction from 30-min comparison
- Test trend includes delta value
- Test response includes all configured sensors

**Implementation:**
- Add route `GET /api/ruuvi/trends`
- For each sensor: compare current vs 30-min ago
- Return `{ mac, temperature: { direction, delta }, humidity: { direction, delta } }`
- Directions: "rising", "rising-slightly", "stable", "falling-slightly", "falling"

**Files:** `server/routes/trends.js`, `server/routes/trends.test.js`, `server/index.js`

---

### Task 2.3: Create Diagnostics API Endpoint

Add endpoint for diagnostics screen data and flush action.

**Test first:**
- Test GET `/api/diagnostics` returns system status
- Test response includes buffer size, last flush time, battery levels
- Test POST `/api/diagnostics/flush` triggers immediate flush
- Test flush endpoint returns success confirmation

**Implementation:**
- Add route `GET /api/diagnostics`
- Return: bufferSize, lastFlushTime, batteries[], dbSize, oldestRecord, uptime, lastScanTime
- Add route `POST /api/diagnostics/flush`
- Trigger `forceFlush()` and return result

**Files:** `server/routes/diagnostics.js`, `server/routes/diagnostics.test.js`, `server/index.js`

---

## Phase 3: Frontend - Navigation & Routing

### Task 3.1: Add React Router and Screen Structure

Set up routing for multiple screens.

**Test first:**
- Test `/` route renders Dashboard
- Test `/history` route renders History screen
- Test `/diagnostics` route renders Diagnostics screen
- Test invalid route redirects to Dashboard

**Implementation:**
- Install `react-router-dom`
- Create `src/screens/DashboardScreen.js` (move existing App content)
- Create `src/screens/HistoryScreen.js` (placeholder)
- Create `src/screens/DiagnosticsScreen.js` (placeholder)
- Update `src/App.js` with Router and Routes

**Files:** `src/App.js`, `src/screens/*.js`, `src/App.test.js`

---

### Task 3.2: Create Floating Speed Dial Navigation

Implement FAB navigation menu.

**Test first:**
- Test SpeedDial renders in bottom-right corner
- Test clicking SpeedDial opens menu
- Test menu shows three options (Dashboard, History, Diagnostics)
- Test clicking option navigates to correct route
- Test menu closes after selection

**Implementation:**
- Create `src/components/NavigationFab.js`
- Use MUI SpeedDial component
- Position: fixed, bottom: 16px, right: 16px
- Icons: Home, Timeline, Build
- Navigate using `useNavigate` hook

**Files:** `src/components/NavigationFab.js`, `src/components/NavigationFab.test.js`, `src/App.js`

---

## Phase 4: Frontend - Dashboard Enhancements

### Task 4.1: Add Trend Arrows to RuuviCard

Display trend indicators on sensor cards.

**Test first:**
- Test trend arrow renders for temperature
- Test trend arrow renders for humidity
- Test correct arrow icon for each direction (‘—’˜“)
- Test delta value displays next to arrow
- Test no arrow when trend data unavailable

**Implementation:**
- Create `src/components/TrendIndicator.js`
- Modify `src/components/RuuviCard.js` to include trends
- Add trend API call to data fetching
- Style: small, colored arrows (green rising, red falling, gray stable)

**Files:** `src/components/TrendIndicator.js`, `src/components/TrendIndicator.test.js`, `src/components/RuuviCard.js`, `src/services/api.js`

---

### Task 4.2: Optimize Dashboard Layout for 800px Height

Tighten spacing to eliminate cropping.

**Test first:**
- Test cards render with reduced padding
- Test grid gaps are tighter
- Test header height is reduced
- Test total content height fits within 752px (800 - 48 header)

**Implementation:**
- Audit current component heights
- Reduce Card padding: 16px ’ 12px
- Reduce Grid spacing: 2 ’ 1.5
- Reduce header height if needed
- Test on 800px viewport

**Files:** `src/App.js`, `src/components/*.js`, theme overrides if needed

---

## Phase 5: Frontend - History Screen

### Task 5.1: Create History Screen Layout

Build the history screen structure with time range selector.

**Test first:**
- Test screen renders with title
- Test time range buttons render (1h, 6h, 24h, 7d, 30d, All)
- Test clicking time range updates selection
- Test sensor list renders for each configured sensor

**Implementation:**
- Build `src/screens/HistoryScreen.js`
- Time range selector using MUI ToggleButtonGroup
- Sensor list section
- Chart area placeholder

**Files:** `src/screens/HistoryScreen.js`, `src/screens/HistoryScreen.test.js`

---

### Task 5.2: Create Sparkline Component

Build mini charts for sensor overview.

**Test first:**
- Test sparkline renders SVG/canvas
- Test sparkline displays data points as line
- Test sparkline shows current value
- Test sparkline handles empty data gracefully

**Implementation:**
- Install `recharts`
- Create `src/components/Sparkline.js`
- Use Recharts LineChart with minimal styling
- Props: data[], color, width, height
- No axes, just the line

**Files:** `src/components/Sparkline.js`, `src/components/Sparkline.test.js`

---

### Task 5.3: Create Sensor History Row Component

Build clickable sensor row with sparkline.

**Test first:**
- Test row displays sensor name
- Test row displays sparkline
- Test row displays current value
- Test clicking row triggers selection callback
- Test selected state has visual indicator

**Implementation:**
- Create `src/components/SensorHistoryRow.js`
- Layout: Name | Sparkline | Current Value
- Click handler for selection
- Selected state styling

**Files:** `src/components/SensorHistoryRow.js`, `src/components/SensorHistoryRow.test.js`

---

### Task 5.4: Create Detail Chart Component

Build full-size chart for selected sensor.

**Test first:**
- Test chart renders with temperature data
- Test chart has time axis (X) and value axis (Y)
- Test chart tooltip shows values on hover
- Test metric tabs switch between temperature/humidity/pressure
- Test chart handles different time ranges appropriately

**Implementation:**
- Create `src/components/DetailChart.js`
- Use Recharts ResponsiveContainer + LineChart
- Tabs for metric selection
- Proper axis formatting for time and values
- Responsive sizing

**Files:** `src/components/DetailChart.js`, `src/components/DetailChart.test.js`

---

### Task 5.5: Integrate History Screen with API

Connect history screen to backend data.

**Test first:**
- Test history API is called on screen mount
- Test API is called with correct range parameter
- Test data updates when time range changes
- Test loading state displays while fetching
- Test error state displays on API failure

**Implementation:**
- Add `getHistory(mac, range)` to `src/services/api.js`
- Add data fetching to HistoryScreen
- Pass data to Sparkline and DetailChart components
- Handle loading and error states

**Files:** `src/screens/HistoryScreen.js`, `src/services/api.js`

---

## Phase 6: Frontend - Diagnostics Screen

### Task 6.1: Create Diagnostics Screen Layout

Build the diagnostics screen structure.

**Test first:**
- Test screen renders with title
- Test buffer status section renders
- Test battery levels section renders
- Test system info section renders

**Implementation:**
- Build `src/screens/DiagnosticsScreen.js`
- Three sections: Buffer Status, Battery Levels, System Info
- Use MUI Card components for each section

**Files:** `src/screens/DiagnosticsScreen.js`, `src/screens/DiagnosticsScreen.test.js`

---

### Task 6.2: Create Battery Level Component

Build battery indicator with visual bar.

**Test first:**
- Test battery bar renders with correct fill percentage
- Test OK status (>2.7V) shows green
- Test Low status (2.5-2.7V) shows yellow
- Test Critical status (<2.5V) shows red
- Test voltage value displays

**Implementation:**
- Create `src/components/BatteryIndicator.js`
- Visual bar using MUI LinearProgress or custom
- Color coding based on voltage thresholds
- Display: sensor name, bar, voltage, status text

**Files:** `src/components/BatteryIndicator.js`, `src/components/BatteryIndicator.test.js`

---

### Task 6.3: Create Flush Button with Confirmation

Build the manual flush button.

**Test first:**
- Test flush button renders
- Test clicking button calls flush API
- Test success state shows confirmation
- Test button is disabled while flushing
- Test error state shows error message

**Implementation:**
- Add flush button to Buffer Status section
- Call `POST /api/diagnostics/flush`
- Show loading spinner while flushing
- Display success/error feedback

**Files:** `src/screens/DiagnosticsScreen.js`, `src/services/api.js`

---

### Task 6.4: Integrate Diagnostics Screen with API

Connect diagnostics screen to backend data.

**Test first:**
- Test diagnostics API is called on screen mount
- Test buffer size displays correctly
- Test last flush time displays correctly
- Test all battery levels display
- Test system info displays (DB size, uptime, etc.)

**Implementation:**
- Add `getDiagnostics()` to `src/services/api.js`
- Add `flushBuffer()` to `src/services/api.js`
- Fetch data on mount and after flush
- Auto-refresh every 30 seconds

**Files:** `src/screens/DiagnosticsScreen.js`, `src/services/api.js`

---

## Phase 7: Optional - tmpfs Buffer

### Task 7.1: Add tmpfs Buffer Support

Implement optional RAM-based buffer storage.

**Test first:**
- Test buffer uses tmpfs path when env var set
- Test buffer falls back to memory when tmpfs disabled
- Test buffer file is created in tmpfs path
- Test buffer survives service restart (but not reboot)

**Implementation:**
- Modify `historyBuffer.js` to optionally persist to tmpfs
- Read `RUUVI_USE_TMPFS_BUFFER` and `RUUVI_TMPFS_PATH` from env
- Write buffer to JSON file in tmpfs on each addition
- Load buffer from file on startup if exists

**Files:** `server/services/history/historyBuffer.js`, `server/services/history/historyBuffer.test.js`

---

## Phase 8: Documentation & Deployment

### Task 8.1: Update Environment Template

Add new environment variables to template.

**Implementation:**
- Update `.env.template` with new variables
- Add comments explaining each variable
- Document tmpfs setup instructions

**Files:** `.env.template`

---

### Task 8.2: Create Systemd Service File

Create service file with graceful shutdown.

**Implementation:**
- Create `scripts/ruuvi-dashboard.service`
- Include ExecStop for flush
- Document installation in README

**Files:** `scripts/ruuvi-dashboard.service`, `README.md`

---

### Task 8.3: Update README with New Features

Document new functionality.

**Implementation:**
- Add History feature section
- Add Diagnostics feature section
- Document data retention policy
- Add tmpfs setup instructions for advanced users

**Files:** `README.md`
