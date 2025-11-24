# RuuviTag Dashboard - Node.js BLE Refactoring Plan

## Objective

Refactor the ruuvi-dashboard codebase to use a completely Node.js-based RuuviTag sensor reading solution, removing the separate Python script dependency. The solution must follow SOLID principles and TDD practices.

## Current Architecture

- **Frontend**: React app (port 3000)
- **Backend**: Express.js server (port 3001)
- **Sensor Reading**: Node.js BLE service using `@abandonware/noble`
- **Communication**: Direct BLE scanning with event-based updates

### Current Data Flow

```
RuuviTag (BLE) → Node.js BLE Service → Cache → Frontend
```

---

## Phase 1: Setup Node.js BLE Infrastructure

**Status**: Complete
**Goal**: Install and configure Node.js BLE libraries

### Tasks

- [x] 1.1 Install `@abandonware/noble` for BLE support
- [x] 1.2 Create `server/services/ble/` directory structure
- [x] 1.3 Write BLE scanner service with TDD
- [x] 1.4 Test BLE connectivity on development machine

### Files Created

- `server/services/ble/bleScanner.js` - Core BLE scanning functionality
- `server/services/ble/bleScanner.test.js` - Unit tests
- `server/services/ble/index.js` - Module exports

### Dependencies Added

```bash
npm install @abandonware/noble
```

---

## Phase 2: Implement RuuviTag Data Parser

**Status**: Complete
**Goal**: Parse RuuviTag manufacturer data into sensor readings

### Tasks

- [x] 2.1 Research RuuviTag data formats (v3, v5)
- [x] 2.2 Implement data format v5 parser (primary)
- [ ] 2.3 Implement data format v3 parser (fallback) - Optional, v5 covers modern tags
- [x] 2.4 Write comprehensive tests with sample data
- [x] 2.5 Validate parser output matches existing `SensorData` type

### Files Created

- `server/services/ruuvi/ruuviParser.js` - Data parsing logic
- `server/services/ruuvi/ruuviParser.test.js` - Unit tests
- `server/services/ruuvi/index.js` - Module exports

### Data Format Reference

**RuuviTag Data Format 5 (RAWv2)**:
- Temperature: -163.84°C to +163.84°C (0.005°C resolution)
- Humidity: 0% to 100% (0.0025% resolution)
- Pressure: 50000 Pa to 115534 Pa (1 Pa resolution)
- Acceleration: -32000 mG to +32000 mG
- Battery voltage: 1.6V to 3.646V
- TX power: -40 dBm to +20 dBm
- Movement counter and sequence number

---

## Phase 3: Integrate BLE Service with Server

**Status**: Complete
**Goal**: Replace Python script integration with Node.js BLE service

### Tasks

- [x] 3.1 Create RuuviTag scanner service combining BLE + parser
- [x] 3.2 Implement MAC address filtering from environment config
- [x] 3.3 Add event-based sensor data updates
- [x] 3.4 Integrate with existing cache system
- [x] 3.5 Update server startup to use new service
- [x] 3.6 Maintain backward compatibility with existing API endpoints

### Files Created/Modified

- `server/services/ruuvi/ruuviScanner.js` - High-level scanner service
- `server/services/ruuvi/ruuviScanner.test.js` - Integration tests
- `server/index.js` - Updated to use new scanner

### Integration Points

```javascript
// Implemented interface
const scanner = ruuviScanner.createScanner({ macs })

scanner.on('collection', (sensorDataCollection) => {
  // Update cache with sensor data
})

scanner.on('data', ({ mac, sensorData }) => {
  // Log individual sensor readings
})

scanner.start()
```

---

## Phase 4: Remove Python Script and Cleanup

**Status**: In Progress
**Goal**: Remove all Python dependencies and clean up codebase

### Tasks

- [x] 4.1 Remove Python script invocation from server/index.js
- [x] 4.2 Delete `scripts/ruuvi.py`
- [ ] 4.3 Update bluetooth.js utility or remove if unused
- [x] 4.4 Remove unnecessary child_process spawn code
- [ ] 4.5 Update package.json scripts (remove Python references)
- [ ] 4.6 Update documentation

### Files Deleted

- `scripts/ruuvi.py` - Removed

### Files to Modify

- `server/utils/bluetooth.js` - Evaluate and update/remove (currently unused)
- `package.json` - Clean up `startall` script (still references Python)

---

## Phase 5: Testing and Validation

**Status**: Pending
**Goal**: Ensure full functionality and reliability

### Tasks

- [ ] 5.1 Run all existing tests to ensure no regressions
- [ ] 5.2 Test with real RuuviTag devices (if available)
- [ ] 5.3 Test simulator mode still works
- [ ] 5.4 Verify frontend receives data correctly
- [ ] 5.5 Performance testing (compare with Python solution)
- [ ] 5.6 Error handling validation

### Test Scenarios

1. Single sensor detection
2. Multiple sensors detection
3. Sensor disconnect/reconnect
4. Invalid data handling
5. Bluetooth interface reset
6. Startup without sensors available

---

## Technical Decisions

### Why @abandonware/noble?

- Active maintenance (last updated recently)
- Cross-platform support (macOS, Linux, Windows)
- Well-documented API
- Used by `node-ruuvitag` package

### Alternative Considered

- `node-ruuvitag`: Higher-level but less flexible
- `node-ble`: Pure JS but less mature
- Direct DBus: Too low-level

### Error Handling Strategy

1. Bluetooth adapter not available → Log warning, retry with backoff
2. Sensor not found → Use cached data, log warning
3. Parse error → Skip invalid data, continue scanning
4. Permission error → Provide clear error message

---

## Environment Variables

```env
REACT_APP_RUUVITAG_MACS=AA:BB:CC:DD:EE:FF,11:22:33:44:55:66
BLE_SCAN_INTERVAL=10000
BLE_SCAN_TIMEOUT=90000
```

---

## Progress Tracking

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| 1. BLE Infrastructure | Complete | 2025-11-24 | 2025-11-24 |
| 2. RuuviTag Parser | Complete | 2025-11-24 | 2025-11-24 |
| 3. Server Integration | Complete | 2025-11-24 | 2025-11-24 |
| 4. Cleanup | In Progress | 2025-11-24 | - |
| 5. Testing | Pending | - | - |

---

## Definition of Done

- [x] All existing tests pass
- [x] New code has >80% test coverage
- [x] No Python dependencies remain (in main flow)
- [x] Frontend displays sensor data correctly
- [x] Simulator mode works for development
- [ ] Documentation updated
- [ ] Clean git history with descriptive commits
