const dateUtils = require('./date')

describe('dateUtils', () => {
  describe('addOneDay', () => {
    it('should add one day to given date', () => {
      const date = new Date('2023-10-24T12:00:00')
      const result = dateUtils.addOneDay(date)

      expect(result.getDate()).toBe(25)
      expect(result.getMonth()).toBe(9) // October is 9 (0-indexed)
      expect(result.getFullYear()).toBe(2023)
    })

    it('should handle month rollover', () => {
      const date = new Date('2023-10-31T12:00:00')
      const result = dateUtils.addOneDay(date)

      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(10) // November
      expect(result.getFullYear()).toBe(2023)
    })

    it('should handle year rollover', () => {
      const date = new Date('2023-12-31T12:00:00')
      const result = dateUtils.addOneDay(date)

      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getFullYear()).toBe(2024)
    })

    it('should default to current date when no argument provided', () => {
      const before = new Date()
      const result = dateUtils.addOneDay()
      const after = new Date()

      // Result should be roughly 1 day after current time
      expect(result.getTime()).toBeGreaterThan(before.getTime())
      // Allow for small time difference during execution
      expect(result.getTime() - before.getTime()).toBeGreaterThanOrEqual(
        24 * 60 * 60 * 1000 - 1000
      )
    })

    it('should handle February 28 in non-leap year', () => {
      const date = new Date('2023-02-28T12:00:00')
      const result = dateUtils.addOneDay(date)

      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(2) // March
    })

    it('should handle February 28 in leap year', () => {
      const date = new Date('2024-02-28T12:00:00')
      const result = dateUtils.addOneDay(date)

      expect(result.getDate()).toBe(29)
      expect(result.getMonth()).toBe(1) // February
    })

    it('should handle February 29 in leap year', () => {
      const date = new Date('2024-02-29T12:00:00')
      const result = dateUtils.addOneDay(date)

      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(2) // March
    })

    it('should modify and return the same date object', () => {
      const date = new Date('2023-10-24T12:00:00')
      const result = dateUtils.addOneDay(date)

      expect(result).toBe(date) // Same reference
    })
  })

  describe('isSameDate', () => {
    it('should return true for same dates with different times', () => {
      const date1 = new Date('2023-10-24T08:00:00')
      const date2 = new Date('2023-10-24T20:00:00')

      expect(dateUtils.isSameDate(date1, date2)).toBe(true)
    })

    it('should return false for different days', () => {
      const date1 = new Date('2023-10-24T12:00:00')
      const date2 = new Date('2023-10-25T12:00:00')

      expect(dateUtils.isSameDate(date1, date2)).toBe(false)
    })

    it('should return false for different months', () => {
      const date1 = new Date('2023-10-24T12:00:00')
      const date2 = new Date('2023-11-24T12:00:00')

      expect(dateUtils.isSameDate(date1, date2)).toBe(false)
    })

    it('should return false for different years', () => {
      const date1 = new Date('2023-10-24T12:00:00')
      const date2 = new Date('2024-10-24T12:00:00')

      expect(dateUtils.isSameDate(date1, date2)).toBe(false)
    })

    it('should handle undefined dates', () => {
      const date = new Date('2023-10-24T12:00:00')

      expect(dateUtils.isSameDate(undefined, date)).toBe(false)
      expect(dateUtils.isSameDate(date, undefined)).toBe(false)
      expect(dateUtils.isSameDate(undefined, undefined)).toBe(true)
    })

    it('should handle null dates', () => {
      const date = new Date('2023-10-24T12:00:00')

      expect(dateUtils.isSameDate(null, date)).toBe(false)
      expect(dateUtils.isSameDate(date, null)).toBe(false)
      expect(dateUtils.isSameDate(null, null)).toBe(true)
    })

    it('should return true for exact same date objects', () => {
      const date = new Date('2023-10-24T12:00:00')

      expect(dateUtils.isSameDate(date, date)).toBe(true)
    })

    it('should handle dates at midnight', () => {
      const date1 = new Date('2023-10-24T00:00:00')
      const date2 = new Date('2023-10-24T23:59:59')

      expect(dateUtils.isSameDate(date1, date2)).toBe(true)
    })

    it('should handle dates around midnight (different days)', () => {
      const date1 = new Date('2023-10-24T23:59:59')
      const date2 = new Date('2023-10-25T00:00:01')

      expect(dateUtils.isSameDate(date1, date2)).toBe(false)
    })
  })
})
