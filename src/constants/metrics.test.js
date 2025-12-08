import {
  METRICS,
  METRICS_BY_KEY,
  METRIC_KEYS,
  getMetricByKey,
  getMetricColor,
  getMetricUnit,
  getMetricLabel,
} from './metrics'

describe('metrics constants', () => {
  describe('METRICS array', () => {
    it('should export an array of metric configurations', () => {
      expect(Array.isArray(METRICS)).toBe(true)
      expect(METRICS.length).toBe(3)
    })

    it('should contain temperature, humidity, and pressure metrics', () => {
      const keys = METRICS.map((m) => m.key)
      expect(keys).toContain('temperature')
      expect(keys).toContain('humidity')
      expect(keys).toContain('pressure')
    })

    it('should have correct structure for each metric', () => {
      METRICS.forEach((metric) => {
        expect(metric).toHaveProperty('key')
        expect(metric).toHaveProperty('label')
        expect(metric).toHaveProperty('unit')
        expect(metric).toHaveProperty('color')
        expect(typeof metric.key).toBe('string')
        expect(typeof metric.label).toBe('string')
        expect(typeof metric.unit).toBe('string')
        expect(typeof metric.color).toBe('string')
      })
    })

    it('should have temperature metric with correct values', () => {
      const temp = METRICS.find((m) => m.key === 'temperature')
      expect(temp.label).toBe('Temperature')
      expect(temp.unit).toBe('°C')
      expect(temp.color).toBe('#ff7043')
    })

    it('should have humidity metric with correct values', () => {
      const humidity = METRICS.find((m) => m.key === 'humidity')
      expect(humidity.label).toBe('Humidity')
      expect(humidity.unit).toBe('%')
      expect(humidity.color).toBe('#42a5f5')
    })

    it('should have pressure metric with correct values', () => {
      const pressure = METRICS.find((m) => m.key === 'pressure')
      expect(pressure.label).toBe('Pressure')
      expect(pressure.unit).toBe('hPa')
      expect(pressure.color).toBe('#66bb6a')
    })
  })

  describe('METRICS_BY_KEY object', () => {
    it('should export an object keyed by metric key', () => {
      expect(typeof METRICS_BY_KEY).toBe('object')
      expect(METRICS_BY_KEY).toHaveProperty('temperature')
      expect(METRICS_BY_KEY).toHaveProperty('humidity')
      expect(METRICS_BY_KEY).toHaveProperty('pressure')
    })

    it('should have correct structure for each metric', () => {
      Object.values(METRICS_BY_KEY).forEach((metric) => {
        expect(metric).toHaveProperty('color')
        expect(metric).toHaveProperty('unit')
        expect(metric).toHaveProperty('label')
        expect(typeof metric.color).toBe('string')
        expect(typeof metric.unit).toBe('string')
        expect(typeof metric.label).toBe('string')
      })
    })

    it('should have matching values with METRICS array', () => {
      METRICS.forEach((metric) => {
        expect(METRICS_BY_KEY[metric.key].color).toBe(metric.color)
        expect(METRICS_BY_KEY[metric.key].unit).toBe(metric.unit)
        expect(METRICS_BY_KEY[metric.key].label).toBe(metric.label)
      })
    })
  })

  describe('METRIC_KEYS array', () => {
    it('should export an array of metric key strings', () => {
      expect(Array.isArray(METRIC_KEYS)).toBe(true)
      expect(METRIC_KEYS).toEqual(['temperature', 'humidity', 'pressure'])
    })

    it('should match keys in METRICS array', () => {
      const keysFromMetrics = METRICS.map((m) => m.key)
      expect(METRIC_KEYS).toEqual(keysFromMetrics)
    })
  })

  describe('getMetricByKey helper', () => {
    it('should return the full metric object for a valid key', () => {
      const temp = getMetricByKey('temperature')
      expect(temp).toEqual({
        key: 'temperature',
        label: 'Temperature',
        unit: '°C',
        color: '#ff7043',
      })
    })

    it('should return undefined for an invalid key', () => {
      expect(getMetricByKey('invalid')).toBeUndefined()
      expect(getMetricByKey('')).toBeUndefined()
      expect(getMetricByKey(null)).toBeUndefined()
      expect(getMetricByKey(undefined)).toBeUndefined()
    })
  })

  describe('getMetricColor helper', () => {
    it('should return the color for a valid metric key', () => {
      expect(getMetricColor('temperature')).toBe('#ff7043')
      expect(getMetricColor('humidity')).toBe('#42a5f5')
      expect(getMetricColor('pressure')).toBe('#66bb6a')
    })

    it('should return fallback color for invalid key', () => {
      expect(getMetricColor('invalid')).toBe('#888')
      expect(getMetricColor('')).toBe('#888')
      expect(getMetricColor(null)).toBe('#888')
    })
  })

  describe('getMetricUnit helper', () => {
    it('should return the unit for a valid metric key', () => {
      expect(getMetricUnit('temperature')).toBe('°C')
      expect(getMetricUnit('humidity')).toBe('%')
      expect(getMetricUnit('pressure')).toBe('hPa')
    })

    it('should return empty string for invalid key', () => {
      expect(getMetricUnit('invalid')).toBe('')
      expect(getMetricUnit('')).toBe('')
      expect(getMetricUnit(null)).toBe('')
    })
  })

  describe('getMetricLabel helper', () => {
    it('should return the label for a valid metric key', () => {
      expect(getMetricLabel('temperature')).toBe('Temperature')
      expect(getMetricLabel('humidity')).toBe('Humidity')
      expect(getMetricLabel('pressure')).toBe('Pressure')
    })

    it('should return the key as fallback for invalid key', () => {
      expect(getMetricLabel('invalid')).toBe('invalid')
      expect(getMetricLabel('custom')).toBe('custom')
    })

    it('should return empty string for null/undefined', () => {
      expect(getMetricLabel(null)).toBe('')
      expect(getMetricLabel(undefined)).toBe('')
    })
  })
})
