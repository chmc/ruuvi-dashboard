import uiFormatter from './formatters'

describe('uiFormatter', () => {
  describe('toTemperatureUI', () => {
    it('should format temperature with one decimal place', () => {
      expect(uiFormatter.toTemperatureUI(20.74)).toBe('20.7')
      expect(uiFormatter.toTemperatureUI(20.75)).toBe('20.8')
      expect(uiFormatter.toTemperatureUI(-5.123)).toBe('-5.1')
    })

    it('should return dash for undefined/null/zero temperature', () => {
      expect(uiFormatter.toTemperatureUI(undefined)).toBe('-')
      expect(uiFormatter.toTemperatureUI(null)).toBe('-')
      expect(uiFormatter.toTemperatureUI(0)).toBe('-')
    })
  })

  describe('toTemperatureRoundUpUI', () => {
    it('should round temperature to nearest integer', () => {
      expect(uiFormatter.toTemperatureRoundUpUI(20.4)).toBe('20')
      expect(uiFormatter.toTemperatureRoundUpUI(20.5)).toBe('21')
      expect(uiFormatter.toTemperatureRoundUpUI(-5.6)).toBe('-6')
    })

    it('should return dash for undefined/null/zero temperature', () => {
      expect(uiFormatter.toTemperatureRoundUpUI(undefined)).toBe('-')
      expect(uiFormatter.toTemperatureRoundUpUI(null)).toBe('-')
      expect(uiFormatter.toTemperatureRoundUpUI(0)).toBe('-')
    })
  })

  describe('toHumidityUI', () => {
    it('should round humidity to nearest integer', () => {
      expect(uiFormatter.toHumidityUI(47.17)).toBe('47')
      expect(uiFormatter.toHumidityUI(47.5)).toBe('48')
      expect(uiFormatter.toHumidityUI(100)).toBe('100')
    })

    it('should return dash for undefined/null/zero humidity', () => {
      expect(uiFormatter.toHumidityUI(undefined)).toBe('-')
      expect(uiFormatter.toHumidityUI(null)).toBe('-')
      expect(uiFormatter.toHumidityUI(0)).toBe('-')
    })
  })

  describe('toPressureUI', () => {
    it('should round pressure to integer string', () => {
      expect(uiFormatter.toPressureUI(1012.17)).toBe('1012')
      expect(uiFormatter.toPressureUI(1012.5)).toBe('1013')
      expect(uiFormatter.toPressureUI(980.9)).toBe('981')
    })

    it('should return dash for undefined/null/zero pressure', () => {
      expect(uiFormatter.toPressureUI(undefined)).toBe('-')
      expect(uiFormatter.toPressureUI(null)).toBe('-')
      expect(uiFormatter.toPressureUI(0)).toBe('-')
    })
  })

  describe('toPressureWeather', () => {
    it('should return storm for pressure below 990', () => {
      expect(uiFormatter.toPressureWeather(985)).toBe('▼ Myrsky')
      expect(uiFormatter.toPressureWeather(989)).toBe('▼ Myrsky')
    })

    it('should return rain for pressure 990-1004', () => {
      expect(uiFormatter.toPressureWeather(990)).toBe('↓ Sade')
      expect(uiFormatter.toPressureWeather(1004)).toBe('↓ Sade')
    })

    it('should return cloudy for pressure 1005-1014', () => {
      expect(uiFormatter.toPressureWeather(1005)).toBe('○ Pilvi')
      expect(uiFormatter.toPressureWeather(1014)).toBe('○ Pilvi')
    })

    it('should return fair for pressure 1015-1024', () => {
      expect(uiFormatter.toPressureWeather(1015)).toBe('↑ Pouta')
      expect(uiFormatter.toPressureWeather(1024)).toBe('↑ Pouta')
    })

    it('should return sunny for pressure 1025 and above', () => {
      expect(uiFormatter.toPressureWeather(1025)).toBe('★ Aurinko')
      expect(uiFormatter.toPressureWeather(1040)).toBe('★ Aurinko')
    })

    it('should return dash for undefined/null/zero pressure', () => {
      expect(uiFormatter.toPressureWeather(undefined)).toBe('-')
      expect(uiFormatter.toPressureWeather(null)).toBe('-')
      expect(uiFormatter.toPressureWeather(0)).toBe('-')
    })
  })

  describe('toDayOfWeekUI', () => {
    it('should return Finnish day abbreviations', () => {
      expect(uiFormatter.toDayOfWeekUI('2023-10-22')).toBe('Su') // Sunday
      expect(uiFormatter.toDayOfWeekUI('2023-10-23')).toBe('Ma') // Monday
      expect(uiFormatter.toDayOfWeekUI('2023-10-24')).toBe('Ti') // Tuesday
      expect(uiFormatter.toDayOfWeekUI('2023-10-25')).toBe('Ke') // Wednesday
      expect(uiFormatter.toDayOfWeekUI('2023-10-26')).toBe('To') // Thursday
      expect(uiFormatter.toDayOfWeekUI('2023-10-27')).toBe('Pe') // Friday
      expect(uiFormatter.toDayOfWeekUI('2023-10-28')).toBe('La') // Saturday
    })
  })

  describe('toShortTimeUI', () => {
    it('should format time as H:MM', () => {
      expect(uiFormatter.toShortTimeUI(new Date('2023-10-24T09:05:00'))).toBe(
        '9:05'
      )
      expect(uiFormatter.toShortTimeUI(new Date('2023-10-24T14:30:00'))).toBe(
        '14:30'
      )
      expect(uiFormatter.toShortTimeUI(new Date('2023-10-24T00:00:00'))).toBe(
        '0:00'
      )
    })
  })

  describe('toSharpTimeUI', () => {
    it('should format hour as H:00', () => {
      expect(uiFormatter.toSharpTimeUI(0)).toBe('0:00')
      expect(uiFormatter.toSharpTimeUI(9)).toBe('9:00')
      expect(uiFormatter.toSharpTimeUI(14)).toBe('14:00')
      expect(uiFormatter.toSharpTimeUI(23)).toBe('23:00')
    })
  })

  describe('toWindUI', () => {
    it('should format wind speed with one decimal', () => {
      expect(uiFormatter.toWindUI(5.5)).toBe('5.5')
      expect(uiFormatter.toWindUI(10.123)).toBe('10.1')
      expect(uiFormatter.toWindUI(0)).toBe('0.0')
    })
  })

  describe('toLocalDate', () => {
    it('should convert unix timestamp to YYYY/MM/DD format', () => {
      // Note: Results depend on local timezone
      const timestamp = 1698163200 // Oct 24, 2023 12:00:00 UTC
      const result = uiFormatter.toLocalDate(timestamp)
      expect(result).toMatch(/^\d{4}\/\d{1,2}\/\d{2}$/)
    })

    it('should pad day with leading zero', () => {
      const timestamp = 1696118400 // Oct 1, 2023 00:00:00 UTC
      const result = uiFormatter.toLocalDate(timestamp)
      expect(result).toMatch(/\/0[1-9]$|\/[12][0-9]$|\/3[01]$/)
    })
  })

  describe('toLocalTime', () => {
    it('should extract hour from unix timestamp', () => {
      // Note: Results depend on local timezone
      const timestamp = 1698163200 // Oct 24, 2023 12:00:00 UTC
      const result = uiFormatter.toLocalTime(timestamp)
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(23)
    })
  })

  describe('toLocalDateTime', () => {
    it('should format timestamp in milliseconds to Finnish locale date/time', () => {
      // Oct 24, 2023 14:30:00 UTC in milliseconds
      const timestamp = 1698165000000
      const result = uiFormatter.toLocalDateTime(timestamp)
      // Should match Finnish locale format: DD.MM.YYYY klo HH.MM
      expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4} klo \d{2}\.\d{2}$/)
    })

    it('should format different timestamps correctly', () => {
      const timestamp1 = 1698165000000 // Oct 24, 2023 14:30:00 UTC
      const timestamp2 = 1609459200000 // Jan 1, 2021 00:00:00 UTC

      const result1 = uiFormatter.toLocalDateTime(timestamp1)
      const result2 = uiFormatter.toLocalDateTime(timestamp2)

      expect(result1).toMatch(/^\d{2}\.\d{2}\.\d{4} klo \d{2}\.\d{2}$/)
      expect(result2).toMatch(/^\d{2}\.\d{2}\.\d{4} klo \d{2}\.\d{2}$/)
      expect(result1).not.toBe(result2)
    })
  })
})
