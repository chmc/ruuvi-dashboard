# TODO - Ruuvi Dashboard (TDD Edition)

> Restructured with strict TDD principles: RED -> GREEN -> REFACTOR
> Generated from 6-agent critical analysis (2025-12-10)

---

## RULES - READ BEFORE STARTING ANY TASK

### Status Markers (Update in Task Title)
- `[ ]` - Pending (not started)
- `[>]` - **In Progress** (currently being worked on)
- `[x]` - Completed

### Workflow Rules

1. **TDD REQUIRED**: Every task follows RED → GREEN → REFACTOR cycle
   - RED: Write failing test FIRST, run `pnpm test`, verify test FAILS
   - GREEN: Write MINIMUM code to pass, run `pnpm test`, verify PASSES
   - REFACTOR: Clean up while tests stay green

2. **MARK IN PROGRESS**: When starting a task, change `[ ]` to `[>]` in the task title
   - Example: `### [ ] Task 1.1` becomes `### [>] Task 1.1`

3. **MARK COMPLETE**: When finished, change `[>]` to `[x]` in the task title
   - Example: `### [>] Task 1.1` becomes `### [x] Task 1.1`

4. **NO COMMITS**: Do NOT commit code - wait for user instruction to commit

5. **WAIT AFTER COMPLETE**: After completing a task, STOP and wait for user instructions

6. **ONE TASK AT A TIME**: Only ONE task should be `[>]` at any time

7. **RUN TESTS**: After EVERY change, run `pnpm test` to verify

### TDD Cycle Commands
```bash
# RED phase - write test, then run:
pnpm test -- --testPathPattern="your-test-file" --watch

# GREEN phase - write code, tests should pass

# REFACTOR phase - clean up, tests should still pass
```

---

## Critical (P0) - Fix Immediately

### [ ] 1. Add timeouts to external API fetch calls

**Problem**: System can hang indefinitely if external APIs are slow/unresponsive.

**Files**:
- `server/services/energyPricesFromApi.js`
- `server/routes/weather.js`
- `src/services/api.js`

#### [x] Task 1.1: Add timeout to energyPricesFromApi.js

**RED Phase** - Write failing test first:
```javascript
// File: server/services/energyPricesFromApi.test.js
describe('getEnergyPricesFromApi()', () => {
  it('should timeout after 10 seconds when API is unresponsive', async () => {
    // Arrange - mock fetch to never resolve
    jest.useFakeTimers()
    global.fetch = jest.fn(() => new Promise(() => {})) // Never resolves

    // Act
    const promise = getEnergyPricesFromApi()
    jest.advanceTimersByTime(10001)

    // Assert
    await expect(promise).rejects.toThrow(/timeout/i)
    jest.useRealTimers()
  })

  it('should return data when API responds within timeout', async () => {
    // Arrange
    global.fetch = jest.fn(() =>
      Promise.resolve({ text: () => Promise.resolve('[{"price": 1}]') })
    )

    // Act
    const result = await getEnergyPricesFromApi()

    // Assert
    expect(result).toBe('[{"price": 1}]')
  })
})
```

**GREEN Phase** - Implement minimum code:
- Add `AbortController` with 10-second timeout to fetch call
- Handle `AbortError` and return `undefined`

**REFACTOR Phase**:
- Extract timeout constant to module scope
- Consider creating a shared `fetchWithTimeout` utility

---

#### [x] Task 1.2: Add timeout to weather.js fetch

**RED Phase** - Write failing test first:
```javascript
// File: server/routes/weather.test.js (add to existing)
describe('fetchWeatherFromApi()', () => {
  it('should timeout after 10 seconds when OpenWeatherMap is unresponsive', async () => {
    // Arrange
    jest.useFakeTimers()
    jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}))
    process.env.OPENWEATHERMAP_APIKEY = 'test-key'

    // Act & Assert
    const promise = fetchWeatherFromApi()
    jest.advanceTimersByTime(10001)
    await expect(promise).rejects.toThrow(/timeout/i)

    jest.useRealTimers()
  })
})
```

**GREEN Phase**:
- Add `AbortController` with 10-second timeout
- Pass `signal` option to fetch

**REFACTOR Phase**:
- Extract timeout to constant
- Consider using shared utility from Task 1.1

---

#### Task 1.3: Add timeout to frontend api.js

**RED Phase** - Write failing test first:
```javascript
// File: src/services/api.test.js
describe('fetchRuuviData()', () => {
  it('should timeout after 10 seconds', async () => {
    // Arrange
    jest.useFakeTimers()
    global.fetch = jest.fn(() => new Promise(() => {}))

    // Act & Assert
    const promise = apiService.fetchRuuviData()
    jest.advanceTimersByTime(10001)
    await expect(promise).rejects.toThrow(/timeout/i)

    jest.useRealTimers()
  })
})
```

**GREEN Phase**:
- Create `fetchWithTimeout` wrapper function
- Apply to all fetch calls in api.js

**REFACTOR Phase**:
- Extract to separate utility module
- Add configurable timeout parameter

---

### [ ] 2. Add BLE adapter timeout and recovery mechanism

**Problem**: If Bluetooth adapter locks up (common on Raspberry Pi), system waits forever.

**File**: `server/services/ble/bleScanner.js`

#### Task 2.1: Add timeout for BLE poweredOn state

**RED Phase** - Write failing test first:
```javascript
// File: server/services/ble/bleScanner.test.js (add to existing)
describe('BLE startup timeout', () => {
  it('should emit error after 30 seconds if BLE never powers on', async () => {
    // Arrange
    jest.useFakeTimers()
    const scanner = createScanner()
    const errorHandler = jest.fn()
    scanner.on('error', errorHandler)

    // Inject mock noble that stays in 'unknown' state
    scanner._setNoble({
      state: 'unknown',
      on: jest.fn(),
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      removeListener: jest.fn(),
    })

    // Act
    scanner.start()
    jest.advanceTimersByTime(30001)

    // Assert
    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/timeout/i) })
    )

    jest.useRealTimers()
  })

  it('should not emit error if BLE powers on within timeout', async () => {
    // Arrange
    jest.useFakeTimers()
    const scanner = createScanner()
    const errorHandler = jest.fn()
    scanner.on('error', errorHandler)

    const mockNoble = {
      state: 'unknown',
      on: jest.fn(),
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      removeListener: jest.fn(),
    }
    scanner._setNoble(mockNoble)

    // Act
    scanner.start()

    // Simulate BLE powering on after 5 seconds
    jest.advanceTimersByTime(5000)
    const stateChangeHandler = mockNoble.on.mock.calls.find(
      (call) => call[0] === 'stateChange'
    )[1]
    stateChangeHandler('poweredOn')

    jest.advanceTimersByTime(30000)

    // Assert
    expect(errorHandler).not.toHaveBeenCalled()

    jest.useRealTimers()
  })
})
```

**GREEN Phase**:
- Add startup timeout (30 seconds) in `start()` method
- Clear timeout when poweredOn received
- Emit 'error' event if timeout expires

**REFACTOR Phase**:
- Extract timeout constant
- Add `_setNoble()` method for testing (dependency injection)

---

#### Task 2.2: Add BLE adapter reset capability

**RED Phase** - Write failing test:
```javascript
describe('BLE adapter recovery', () => {
  it('should attempt adapter reset on persistent failure', async () => {
    // Arrange
    const resetAdapter = jest.fn().mockResolvedValue(true)
    const scanner = createScanner({ resetAdapter })

    // Act - simulate multiple failures
    scanner.start()
    scanner.emit('error', { message: 'BLE timeout' })

    // Assert
    expect(resetAdapter).toHaveBeenCalledTimes(1)
  })
})
```

**GREEN Phase**:
- Accept optional `resetAdapter` callback in scanner config
- Call reset on error events

**REFACTOR Phase**:
- Add exponential backoff between reset attempts
- Log reset attempts

---

### [ ] 3. Implement invalid value detection in RuuviTag parser

**Problem**: Parser accepts invalid readings (e.g., `0x8000` for temp = invalid marker) as real data.

**File**: `server/services/ruuvi/ruuviParser.js`

**Reference**: [RuuviTag Data Format 5](https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2)

Invalid value markers:
- Temperature: `0x8000` (-163.84 when parsed)
- Humidity: `0xFFFF`
- Pressure: `0xFFFF`
- Acceleration (X/Y/Z): `0x8000`
- Battery: `0x7FF` (in 11-bit field)
- TX Power: `0x1F` (in 5-bit field)
- Movement counter: `0xFF`
- Measurement sequence: `0xFFFF`

#### Task 3.1: Detect invalid temperature marker

**RED Phase** - Write failing test first:
```javascript
// File: server/services/ruuvi/ruuviParser.test.js (add to existing)
describe('Invalid value detection', () => {
  it('should return null for invalid temperature marker (0x8000)', () => {
    // Arrange - 0x8000 = invalid temperature
    const manufacturerData = Buffer.from([
      0x99, 0x04,             // Manufacturer ID
      0x05,                   // Data format 5
      0x80, 0x00,             // Temperature: 0x8000 = INVALID
      0x40, 0x00,             // Humidity: valid
      0x00, 0x00,             // Pressure: valid
      0x00, 0x00,             // Accel-X
      0x00, 0x00,             // Accel-Y
      0x00, 0x00,             // Accel-Z
      0x00, 0x00,             // Power
      0x00,                   // Movement
      0x00, 0x00,             // Sequence
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // MAC
    ])

    // Act
    const result = ruuviParser.parse(manufacturerData)

    // Assert
    expect(result).toBeNull()
  })

  it('should accept valid temperature near invalid marker boundary', () => {
    // Arrange - 0x7FFF = 163.835C (max valid positive temp)
    const manufacturerData = Buffer.from([
      0x99, 0x04, 0x05,
      0x7F, 0xFF,             // Temperature: max valid
      0x40, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ])

    // Act
    const result = ruuviParser.parse(manufacturerData)

    // Assert
    expect(result).not.toBeNull()
    expect(result.temperature).toBeCloseTo(163.835, 2)
  })
})
```

**GREEN Phase**:
- Add constant `INVALID_TEMPERATURE = 0x8000`
- Check raw temperature value before calculating
- Return `null` if invalid marker found

**REFACTOR Phase**:
- Group all invalid marker constants together

---

#### Task 3.2: Detect invalid humidity marker

**RED Phase**:
```javascript
it('should return null for invalid humidity marker (0xFFFF)', () => {
  // Arrange - 0xFFFF = invalid humidity
  const manufacturerData = Buffer.from([
    0x99, 0x04, 0x05,
    0x12, 0xFC,             // Temperature: valid
    0xFF, 0xFF,             // Humidity: 0xFFFF = INVALID
    0x00, 0x00,             // Pressure
    // ... rest of valid data
  ])

  const result = ruuviParser.parse(manufacturerData)
  expect(result).toBeNull()
})
```

**GREEN Phase**:
- Add constant `INVALID_HUMIDITY = 0xFFFF`
- Check raw humidity value

---

#### Task 3.3: Detect invalid pressure marker

**RED Phase**:
```javascript
it('should return null for invalid pressure marker (0xFFFF)', () => {
  const manufacturerData = createValidBuffer({ pressure: 0xFFFF })
  const result = ruuviParser.parse(manufacturerData)
  expect(result).toBeNull()
})
```

**GREEN Phase**:
- Add constant `INVALID_PRESSURE = 0xFFFF`
- Check raw pressure value

---

#### Task 3.4: Detect invalid acceleration markers

**RED Phase**:
```javascript
it('should return null for invalid acceleration X marker (0x8000)', () => {
  // Test each acceleration axis separately
})
```

**GREEN Phase**:
- Add constant `INVALID_ACCELERATION = 0x8000`
- Check each acceleration axis

---

#### Task 3.5: Detect invalid battery/power markers

**RED Phase**:
```javascript
it('should return null for invalid battery marker (0x7FF in 11-bit field)', () => {
  // Battery field: top 11 bits of power word = 0x7FF
})
```

**GREEN Phase**:
- Add constants for battery and TX power invalid markers
- Check before returning

**REFACTOR Phase** (after all sub-tasks):
- Create helper function `isValidReading(rawValues)`
- Consider returning partial data with `null` for invalid fields instead of rejecting entire reading

---

### [ ] 4. Fix boolean props passed as strings (bug)

**Problem**: `showTime="true"` should be `showTime={true}`. `"false"` is truthy in JavaScript!

**File**: `src/components/WeatherForecastCard.jsx` (lines 27, 34)

#### Task 4.1: Add prop-types validation and fix bug

**RED Phase** - Write failing test:
```javascript
// File: src/components/WeatherForecastCard.test.jsx
import { render } from '@testing-library/react'
import WeatherForecastCard from './WeatherForecastCard'

describe('WeatherForecastCard', () => {
  it('should not show time when showTime is false', () => {
    // Arrange
    const forecast = {
      hourlyForecast: [],
      dailyForecast: [{
        weekDay: 'Ma',
        temp: 20,
        wind: 5,
        iconUrl: 'http://test.com/icon.png',
        time: 12,
      }],
    }

    // Act
    const { queryByText } = render(
      <WeatherForecastCard weatherForecast={forecast} />
    )

    // Assert - time should NOT be shown for daily forecast
    expect(queryByText('12')).not.toBeInTheDocument()
  })
})
```

**GREEN Phase**:
- Change `showTime="true"` to `showTime={true}` (line 27)
- Change `showTime="false"` to `showTime={false}` (line 34)

**REFACTOR Phase**:
- Add PropTypes to WeatherCard component to catch this in development
- Consider using TypeScript or JSDoc with ts-check

---

### [ ] 5. Move ChartJS.register() outside component

**Problem**: Registration called on every render - wasteful CPU and potential memory issues.

**File**: `src/components/VerticalBarChart.jsx` (lines 30-38)

#### Task 5.1: Extract ChartJS registration to module scope

**RED Phase** - Write failing test:
```javascript
// File: src/components/VerticalBarChart.test.jsx
import { render } from '@testing-library/react'
import { Chart as ChartJS } from 'chart.js'

// Mock ChartJS.register to track calls
jest.mock('chart.js', () => ({
  ...jest.requireActual('chart.js'),
  Chart: {
    ...jest.requireActual('chart.js').Chart,
    register: jest.fn(),
  },
}))

describe('VerticalBarChart', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not call ChartJS.register on every render', () => {
    // Arrange
    const props = {
      title: 'Test',
      dataset: [1, 2, 3],
      labels: ['a', 'b', 'c'],
      fullData: [],
      showLabels: true,
    }

    // Act - render twice
    const { rerender } = render(<VerticalBarChart {...props} />)
    rerender(<VerticalBarChart {...props} title="Updated" />)

    // Assert - register should only be called once (at module load)
    // or at most once per render (not at all if moved to module scope)
    const registerCalls = ChartJS.register.mock.calls.length
    expect(registerCalls).toBeLessThanOrEqual(1)
  })
})
```

**GREEN Phase**:
- Move `ChartJS.register(...)` call outside the component function
- Place at module scope, after imports

**REFACTOR Phase**:
- Consider creating a separate `chartConfig.js` for all Chart.js setup
- Add comment explaining why registration is at module scope

---

## High Priority (P1)

### [ ] 6. Add retry logic with exponential backoff

**Files**: `server/services/energyPricesFromApi.js`, `server/routes/weather.js`

#### Task 6.1: Create fetchWithRetry utility

**RED Phase**:
```javascript
// File: server/utils/fetchWithRetry.test.js
describe('fetchWithRetry()', () => {
  it('should return data on first successful attempt', async () => {
    // Arrange
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, json: () => ({}) })

    // Act
    const result = await fetchWithRetry('http://test.com', { fetch: mockFetch })

    // Assert
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should retry 3 times on failure before giving up', async () => {
    // Arrange
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'))

    // Act & Assert
    await expect(fetchWithRetry('http://test.com', {
      fetch: mockFetch,
      maxRetries: 3,
    })).rejects.toThrow()

    expect(mockFetch).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
  })

  it('should use exponential backoff between retries', async () => {
    // Arrange
    jest.useFakeTimers()
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue({ ok: true })

    // Act
    const promise = fetchWithRetry('http://test.com', {
      fetch: mockFetch,
      initialDelayMs: 1000,
    })

    // Assert delays: 1000ms, 2000ms
    await jest.advanceTimersByTimeAsync(1000)
    expect(mockFetch).toHaveBeenCalledTimes(2)

    await jest.advanceTimersByTimeAsync(2000)
    expect(mockFetch).toHaveBeenCalledTimes(3)

    await promise
    jest.useRealTimers()
  })

  it('should succeed if retry eventually works', async () => {
    // Arrange
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue({ ok: true, text: () => 'success' })

    // Act
    const result = await fetchWithRetry('http://test.com', { fetch: mockFetch })

    // Assert
    expect(result.ok).toBe(true)
  })
})
```

**GREEN Phase**:
- Create `server/utils/fetchWithRetry.js`
- Implement retry logic with configurable attempts and delays
- Use exponential backoff formula: `delay * 2^attempt`

**REFACTOR Phase**:
- Add jitter to prevent thundering herd
- Make backoff strategy configurable

---

### [ ] 7. Add input validation for POST /api/ruuvi

**Problem**: POST endpoint accepts any data without validation.

**File**: `server/index.js` (lines 71-89)

#### Task 7.1: Validate request body structure

**RED Phase**:
```javascript
// File: server/index.test.js (add to existing)
describe('POST /api/ruuvi', () => {
  it('should return 400 for missing request body', async () => {
    const response = await request(app)
      .post('/api/ruuvi')
      .send()

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for non-object request body', async () => {
    const response = await request(app)
      .post('/api/ruuvi')
      .send('invalid')

    expect(response.status).toBe(400)
  })

  it('should return 400 for sensor data with invalid MAC format', async () => {
    const response = await request(app)
      .post('/api/ruuvi')
      .send({
        'not-a-mac': { temperature: 20 }
      })

    expect(response.status).toBe(400)
    expect(response.body.error.message).toMatch(/mac/i)
  })

  it('should return 400 for sensor data with invalid temperature', async () => {
    const response = await request(app)
      .post('/api/ruuvi')
      .send({
        'aa:bb:cc:dd:ee:ff': { temperature: 'not-a-number' }
      })

    expect(response.status).toBe(400)
  })

  it('should accept valid sensor data', async () => {
    const response = await request(app)
      .post('/api/ruuvi')
      .send({
        'aa:bb:cc:dd:ee:ff': {
          temperature: 20.5,
          humidity: 45,
          pressure: 101325,
        }
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })
})
```

**GREEN Phase**:
- Add validation middleware for POST /api/ruuvi
- Check body is object
- Validate MAC address format (regex: `/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i`)
- Validate sensor values are numbers

**REFACTOR Phase**:
- Extract validation to separate middleware file
- Consider using Joi or Zod for schema validation

---

### [ ] 8. Add sensor value sanity validation

**Problem**: Accept only physically possible values from sensors.

**Files**: `server/services/ruuvi/ruuviParser.js` or new `server/utils/sensorValidation.js`

**Valid ranges (RuuviTag specs)**:
- Temperature: -40 to +85C
- Humidity: 0 to 100%
- Pressure: 50000 to 115536 Pa (500-1155 hPa)

#### Task 8.1: Create sensor value validator

**RED Phase**:
```javascript
// File: server/utils/sensorValidation.test.js
describe('validateSensorValues()', () => {
  it('should return true for values within valid range', () => {
    const values = {
      temperature: 22.5,
      humidity: 45,
      pressure: 101325,
    }
    expect(validateSensorValues(values)).toBe(true)
  })

  it('should return false for temperature below -40C', () => {
    const values = { temperature: -41 }
    expect(validateSensorValues(values)).toBe(false)
  })

  it('should return false for temperature above 85C', () => {
    const values = { temperature: 86 }
    expect(validateSensorValues(values)).toBe(false)
  })

  it('should return false for humidity below 0%', () => {
    const values = { humidity: -1 }
    expect(validateSensorValues(values)).toBe(false)
  })

  it('should return false for humidity above 100%', () => {
    const values = { humidity: 101 }
    expect(validateSensorValues(values)).toBe(false)
  })

  it('should return false for pressure outside valid range', () => {
    expect(validateSensorValues({ pressure: 49999 })).toBe(false)
    expect(validateSensorValues({ pressure: 115537 })).toBe(false)
  })

  it('should accept boundary values', () => {
    expect(validateSensorValues({ temperature: -40 })).toBe(true)
    expect(validateSensorValues({ temperature: 85 })).toBe(true)
    expect(validateSensorValues({ humidity: 0 })).toBe(true)
    expect(validateSensorValues({ humidity: 100 })).toBe(true)
  })
})
```

**GREEN Phase**:
- Create `validateSensorValues(values)` function
- Define constants for valid ranges
- Return boolean

**REFACTOR Phase**:
- Return detailed validation result with field-level errors
- Integrate with ruuviParser.js

---

## Testing Improvements (P1)

### [ ] 9. Replace snapshot tests with explicit assertions

**Problem**: Snapshot tests are fragile and don't document expected behavior.

**Files**:
- `server/services/sensor.test.js`
- `server/services/energyPrices.test.js`

#### Task 9.1: Replace sensor.test.js snapshots

**RED Phase**: (The existing snapshot tests already pass - we're improving them)

**GREEN Phase** - Replace each snapshot test:
```javascript
// BEFORE (snapshot)
expect(act).toMatchSnapshot()

// AFTER (explicit)
expect(act).toEqual({
  mac1: {
    humidity: 47.17,
    temperature: 20.74,
    pressure: 1012.17,
    mac: 'mac1',
  },
  mac2: {
    humidity: 47.27,
    temperature: 21.37,
    pressure: 1012.4,
    mac: 'mac2',
  },
})
```

**REFACTOR Phase**:
- Delete snapshot files after conversion
- Add helper functions for creating test data

---

#### Task 9.2: Replace energyPrices.test.js snapshots

Follow same pattern as Task 9.1.

---

### [ ] 10. Add tests for energyPricesFromApi.js

**Problem**: No tests exist for this module.

**File**: `server/services/energyPricesFromApi.js`

#### Task 10.1: Test successful API response

**RED Phase**:
```javascript
// File: server/services/energyPricesFromApi.test.js
describe('getEnergyPricesFromApi()', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return text data from successful API call', async () => {
    // Arrange
    const mockResponse = '[{"price": 0.05}]'
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(mockResponse),
    })

    // Act
    const result = await getEnergyPricesFromApi()

    // Assert
    expect(result).toBe(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.spot-hinta.fi/TodayAndDayForward'
    )
  })

  it('should return undefined when fetch throws', async () => {
    // Arrange
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    // Act
    const result = await getEnergyPricesFromApi()

    // Assert
    expect(result).toBeUndefined()
  })

  it('should return undefined when response.text() throws', async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.reject(new Error('Parse error')),
    })

    // Act
    const result = await getEnergyPricesFromApi()

    // Assert
    expect(result).toBeUndefined()
  })
})
```

**GREEN Phase**: Tests should pass against existing implementation.

**REFACTOR Phase**:
- Add timeout test (once Task 1.1 is complete)
- Add retry test (once Task 6.1 is complete)

---

## Medium Priority (P2)

### [ ] 11. Add request body size limit

**File**: `server/index.js`

#### Task 11.1: Configure express.json() body limit

**RED Phase**:
```javascript
describe('Request body size limit', () => {
  it('should reject requests larger than 100KB', async () => {
    const largeBody = { data: 'x'.repeat(200 * 1024) }

    const response = await request(app)
      .post('/api/ruuvi')
      .send(largeBody)

    expect(response.status).toBe(413) // Payload Too Large
  })
})
```

**GREEN Phase**:
- Add `limit` option to `express.json({ limit: '100kb' })`

---

### [ ] 12. Implement simple /health endpoint

**File**: `server/index.js`

#### Task 12.1: Create health check endpoint

**RED Phase**:
```javascript
describe('GET /health', () => {
  it('should return 200 with status ok', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    })
  })
})
```

**GREEN Phase**:
- Add `app.get('/health', ...)`
- Return status and timestamp

**REFACTOR Phase**:
- Add uptime, memory usage, BLE scanner status

---

## Completed

- [x] Standardize API response envelope across all endpoints
- [x] Add ChartConfigContext for theme-aware chart colors
- [x] Replace console.log with structured pino logging (backend)
- [x] Add configurable CORS middleware

---

## Analysis Details

Full analysis report available at: `.claude/plans/curried-herding-blum.md`

**Overall Codebase Score: 6.2/10**

| Area | Score |
|------|-------|
| API Integration | 6/10 |
| DevOps/Deployment | 6.5/10 |
| Documentation | 6/10 |
| Frontend/React | 7/10 |
| IoT/Hardware | 5/10 |
| Testing | 6.5/10 |
