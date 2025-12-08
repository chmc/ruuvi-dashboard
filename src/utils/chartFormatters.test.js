import {
  formatXAxisTime,
  formatTooltipLabel,
  formatTooltipValue,
  formatYAxisValue,
  getXAxisTickCount,
} from './chartFormatters'

describe('chartFormatters', () => {
  describe('formatXAxisTime', () => {
    // Use a fixed timestamp for testing: 2024-01-15 14:30:00
    const timestamp = new Date('2024-01-15T14:30:00').getTime()

    it('should format time for 1h range (time only)', () => {
      const result = formatXAxisTime(timestamp, '1h')
      // Should include hour and minute
      expect(result).toMatch(/\d{1,2}[.:]\d{2}/)
    })

    it('should format time for 6h range (time only)', () => {
      const result = formatXAxisTime(timestamp, '6h')
      expect(result).toMatch(/\d{1,2}[.:]\d{2}/)
    })

    it('should format time for 24h range (time only)', () => {
      const result = formatXAxisTime(timestamp, '24h')
      expect(result).toMatch(/\d{1,2}[.:]\d{2}/)
    })

    it('should format date for 7d range (weekday and day)', () => {
      const result = formatXAxisTime(timestamp, '7d')
      // Should include some form of weekday or day number
      expect(result.length).toBeGreaterThan(0)
    })

    it('should format date for 30d range (day and month)', () => {
      const result = formatXAxisTime(timestamp, '30d')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should format date for all range (day and month)', () => {
      const result = formatXAxisTime(timestamp, 'all')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle undefined timeRange with default format', () => {
      const result = formatXAxisTime(timestamp, undefined)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('formatTooltipLabel', () => {
    const timestamp = new Date('2024-01-15T14:30:00').getTime()

    it('should format timestamp with day, month, hour and minute', () => {
      const result = formatTooltipLabel(timestamp)
      // Should return a string with date and time info
      expect(result.length).toBeGreaterThan(5)
    })

    it('should handle different timestamps', () => {
      const morning = new Date('2024-06-20T08:15:00').getTime()
      const result = formatTooltipLabel(morning)
      expect(result.length).toBeGreaterThan(5)
    })
  })

  describe('formatTooltipValue', () => {
    it('should format number value with unit', () => {
      expect(formatTooltipValue(23.456, '°C')).toBe('23.5°C')
      expect(formatTooltipValue(65.0, '%')).toBe('65.0%')
      expect(formatTooltipValue(1013.25, 'hPa')).toBe('1013.3hPa')
    })

    it('should format integer values with one decimal', () => {
      expect(formatTooltipValue(20, '°C')).toBe('20.0°C')
    })

    it('should handle zero value', () => {
      expect(formatTooltipValue(0, '°C')).toBe('0.0°C')
    })

    it('should handle negative values', () => {
      expect(formatTooltipValue(-5.7, '°C')).toBe('-5.7°C')
    })

    it('should return dash for null value', () => {
      expect(formatTooltipValue(null, '°C')).toBe('-')
    })

    it('should return dash for undefined value', () => {
      expect(formatTooltipValue(undefined, '°C')).toBe('-')
    })

    it('should handle string values (pass through)', () => {
      expect(formatTooltipValue('N/A', '°C')).toBe('N/A°C')
    })
  })

  describe('formatYAxisValue', () => {
    it('should format number to integer (no decimals)', () => {
      expect(formatYAxisValue(23.456)).toBe('23')
      expect(formatYAxisValue(23.9)).toBe('24')
      expect(formatYAxisValue(100.0)).toBe('100')
    })

    it('should handle zero', () => {
      expect(formatYAxisValue(0)).toBe('0')
    })

    it('should handle negative values', () => {
      expect(formatYAxisValue(-5.7)).toBe('-6')
    })

    it('should return empty string for null', () => {
      expect(formatYAxisValue(null)).toBe('')
    })

    it('should return empty string for undefined', () => {
      expect(formatYAxisValue(undefined)).toBe('')
    })

    it('should handle string values (pass through)', () => {
      expect(formatYAxisValue('N/A')).toBe('N/A')
    })
  })

  describe('getXAxisTickCount', () => {
    it('should return 4 ticks for 1h range (every 15 minutes)', () => {
      expect(getXAxisTickCount('1h')).toBe(4)
    })

    it('should return 6 ticks for 6h range (every hour)', () => {
      expect(getXAxisTickCount('6h')).toBe(6)
    })

    it('should return 6 ticks for 24h range (every 4 hours)', () => {
      expect(getXAxisTickCount('24h')).toBe(6)
    })

    it('should return 7 ticks for 7d range (every day)', () => {
      expect(getXAxisTickCount('7d')).toBe(7)
    })

    it('should return 6 ticks for 30d range (every 5 days)', () => {
      expect(getXAxisTickCount('30d')).toBe(6)
    })

    it('should return 5 ticks for all range (default)', () => {
      expect(getXAxisTickCount('all')).toBe(5)
    })

    it('should return 5 ticks for unknown range (default)', () => {
      expect(getXAxisTickCount('unknown')).toBe(5)
      expect(getXAxisTickCount(undefined)).toBe(5)
    })
  })
})
