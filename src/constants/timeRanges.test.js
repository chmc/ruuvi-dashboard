import {
  TIME_RANGES,
  TIME_RANGE_VALUES,
  DEFAULT_TIME_RANGE,
  getTimeRangeLabel,
  getTimeRangeByValue,
  isValidTimeRange,
} from './timeRanges'

describe('timeRanges constants', () => {
  describe('TIME_RANGES array', () => {
    it('should export an array of time range configurations', () => {
      expect(Array.isArray(TIME_RANGES)).toBe(true)
      expect(TIME_RANGES.length).toBe(6)
    })

    it('should contain all expected time ranges in order', () => {
      const values = TIME_RANGES.map((r) => r.value)
      expect(values).toEqual(['1h', '6h', '24h', '7d', '30d', 'all'])
    })

    it('should have correct structure for each time range', () => {
      TIME_RANGES.forEach((range) => {
        expect(range).toHaveProperty('value')
        expect(range).toHaveProperty('label')
        expect(typeof range.value).toBe('string')
        expect(typeof range.label).toBe('string')
      })
    })

    it('should have 1h time range with correct values', () => {
      const range = TIME_RANGES.find((r) => r.value === '1h')
      expect(range.label).toBe('1h')
    })

    it('should have 6h time range with correct values', () => {
      const range = TIME_RANGES.find((r) => r.value === '6h')
      expect(range.label).toBe('6h')
    })

    it('should have 24h time range with correct values', () => {
      const range = TIME_RANGES.find((r) => r.value === '24h')
      expect(range.label).toBe('24h')
    })

    it('should have 7d time range with correct values', () => {
      const range = TIME_RANGES.find((r) => r.value === '7d')
      expect(range.label).toBe('7d')
    })

    it('should have 30d time range with correct values', () => {
      const range = TIME_RANGES.find((r) => r.value === '30d')
      expect(range.label).toBe('30d')
    })

    it('should have all time range with correct values', () => {
      const range = TIME_RANGES.find((r) => r.value === 'all')
      expect(range.label).toBe('All')
    })
  })

  describe('TIME_RANGE_VALUES array', () => {
    it('should export an array of time range value strings', () => {
      expect(Array.isArray(TIME_RANGE_VALUES)).toBe(true)
      expect(TIME_RANGE_VALUES).toEqual(['1h', '6h', '24h', '7d', '30d', 'all'])
    })

    it('should match values in TIME_RANGES array', () => {
      const valuesFromRanges = TIME_RANGES.map((r) => r.value)
      expect(TIME_RANGE_VALUES).toEqual(valuesFromRanges)
    })
  })

  describe('DEFAULT_TIME_RANGE', () => {
    it('should be 24h', () => {
      expect(DEFAULT_TIME_RANGE).toBe('24h')
    })

    it('should be a valid time range value', () => {
      expect(TIME_RANGE_VALUES).toContain(DEFAULT_TIME_RANGE)
    })
  })

  describe('getTimeRangeLabel helper', () => {
    it('should return the label for a valid time range value', () => {
      expect(getTimeRangeLabel('1h')).toBe('1h')
      expect(getTimeRangeLabel('6h')).toBe('6h')
      expect(getTimeRangeLabel('24h')).toBe('24h')
      expect(getTimeRangeLabel('7d')).toBe('7d')
      expect(getTimeRangeLabel('30d')).toBe('30d')
      expect(getTimeRangeLabel('all')).toBe('All')
    })

    it('should return empty string for invalid value', () => {
      expect(getTimeRangeLabel('invalid')).toBe('')
      expect(getTimeRangeLabel('')).toBe('')
      expect(getTimeRangeLabel(null)).toBe('')
      expect(getTimeRangeLabel(undefined)).toBe('')
    })
  })

  describe('getTimeRangeByValue helper', () => {
    it('should return the full time range object for a valid value', () => {
      const range = getTimeRangeByValue('24h')
      expect(range).toEqual({
        value: '24h',
        label: '24h',
      })
    })

    it('should return undefined for an invalid value', () => {
      expect(getTimeRangeByValue('invalid')).toBeUndefined()
      expect(getTimeRangeByValue('')).toBeUndefined()
      expect(getTimeRangeByValue(null)).toBeUndefined()
      expect(getTimeRangeByValue(undefined)).toBeUndefined()
    })
  })

  describe('isValidTimeRange helper', () => {
    it('should return true for valid time range values', () => {
      expect(isValidTimeRange('1h')).toBe(true)
      expect(isValidTimeRange('6h')).toBe(true)
      expect(isValidTimeRange('24h')).toBe(true)
      expect(isValidTimeRange('7d')).toBe(true)
      expect(isValidTimeRange('30d')).toBe(true)
      expect(isValidTimeRange('all')).toBe(true)
    })

    it('should return false for invalid time range values', () => {
      expect(isValidTimeRange('invalid')).toBe(false)
      expect(isValidTimeRange('')).toBe(false)
      expect(isValidTimeRange(null)).toBe(false)
      expect(isValidTimeRange(undefined)).toBe(false)
      expect(isValidTimeRange('2h')).toBe(false)
      expect(isValidTimeRange('1d')).toBe(false)
    })
  })
})
