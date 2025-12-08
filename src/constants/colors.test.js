import { SENSOR_COLORS, getSensorColor, DEFAULT_SENSOR_COLOR } from './colors'

describe('colors constants', () => {
  describe('SENSOR_COLORS array', () => {
    it('should export an array of color strings', () => {
      expect(Array.isArray(SENSOR_COLORS)).toBe(true)
      expect(SENSOR_COLORS.length).toBeGreaterThan(0)
    })

    it('should contain at least 8 colors for multiple sensors', () => {
      expect(SENSOR_COLORS.length).toBeGreaterThanOrEqual(8)
    })

    it('should contain valid hex color codes', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/
      SENSOR_COLORS.forEach((color) => {
        expect(color).toMatch(hexColorRegex)
      })
    })

    it('should have unique colors', () => {
      const uniqueColors = new Set(SENSOR_COLORS)
      expect(uniqueColors.size).toBe(SENSOR_COLORS.length)
    })

    it('should contain the expected colors', () => {
      expect(SENSOR_COLORS).toContain('#ff7043') // Deep Orange
      expect(SENSOR_COLORS).toContain('#42a5f5') // Blue
      expect(SENSOR_COLORS).toContain('#66bb6a') // Green
      expect(SENSOR_COLORS).toContain('#ab47bc') // Purple
    })
  })

  describe('DEFAULT_SENSOR_COLOR', () => {
    it('should export a valid hex color code', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/
      expect(DEFAULT_SENSOR_COLOR).toMatch(hexColorRegex)
    })

    it('should be a gray color', () => {
      expect(DEFAULT_SENSOR_COLOR).toBe('#888888')
    })
  })

  describe('getSensorColor helper', () => {
    it('should return correct color for valid indices', () => {
      expect(getSensorColor(0)).toBe(SENSOR_COLORS[0])
      expect(getSensorColor(1)).toBe(SENSOR_COLORS[1])
      expect(getSensorColor(7)).toBe(SENSOR_COLORS[7])
    })

    it('should wrap around for indices beyond array length', () => {
      const { length } = SENSOR_COLORS
      expect(getSensorColor(length)).toBe(SENSOR_COLORS[0])
      expect(getSensorColor(length + 1)).toBe(SENSOR_COLORS[1])
      expect(getSensorColor(length * 2 + 3)).toBe(SENSOR_COLORS[3])
    })

    it('should handle negative indices by returning default color', () => {
      expect(getSensorColor(-1)).toBe(DEFAULT_SENSOR_COLOR)
      expect(getSensorColor(-10)).toBe(DEFAULT_SENSOR_COLOR)
    })

    it('should handle non-integer indices by flooring', () => {
      expect(getSensorColor(1.5)).toBe(SENSOR_COLORS[1])
      expect(getSensorColor(2.9)).toBe(SENSOR_COLORS[2])
    })

    it('should return default color for invalid inputs', () => {
      expect(getSensorColor(null)).toBe(DEFAULT_SENSOR_COLOR)
      expect(getSensorColor(undefined)).toBe(DEFAULT_SENSOR_COLOR)
      expect(getSensorColor('invalid')).toBe(DEFAULT_SENSOR_COLOR)
      expect(getSensorColor(NaN)).toBe(DEFAULT_SENSOR_COLOR)
    })
  })
})
