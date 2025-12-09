import errorLogService from './errorLog'

describe('errorLogService', () => {
  beforeEach(() => {
    errorLogService.clear()
  })

  describe('addError', () => {
    it('should add an error to the log', () => {
      errorLogService.addError('Test error message')

      const errors = errorLogService.getErrors()
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe('Test error message')
    })

    it('should add timestamp to error entry', () => {
      const before = Date.now()
      errorLogService.addError('Test error')
      const after = Date.now()

      const errors = errorLogService.getErrors()
      expect(errors[0].timestamp).toBeGreaterThanOrEqual(before)
      expect(errors[0].timestamp).toBeLessThanOrEqual(after)
    })

    it('should add unique id to error entry', () => {
      errorLogService.addError('Error 1')
      errorLogService.addError('Error 2')

      const errors = errorLogService.getErrors()
      expect(errors[0].id).toBeDefined()
      expect(errors[1].id).toBeDefined()
      expect(errors[0].id).not.toBe(errors[1].id)
    })

    it('should add source to error entry when provided', () => {
      errorLogService.addError('Test error', { source: 'weather' })

      const errors = errorLogService.getErrors()
      expect(errors[0].source).toBe('weather')
    })

    it('should limit errors to max 50 entries', () => {
      for (let i = 0; i < 60; i += 1) {
        errorLogService.addError(`Error ${i}`)
      }

      const errors = errorLogService.getErrors()
      expect(errors).toHaveLength(50)
      // Should keep the most recent errors (10-59)
      expect(errors[0].message).toBe('Error 10')
      expect(errors[49].message).toBe('Error 59')
    })

    it('should return the error entry', () => {
      const entry = errorLogService.addError('Test error', { source: 'api' })

      expect(entry.message).toBe('Test error')
      expect(entry.source).toBe('api')
      expect(entry.id).toBeDefined()
      expect(entry.timestamp).toBeDefined()
    })
  })

  describe('getErrors', () => {
    it('should return empty array when no errors', () => {
      const errors = errorLogService.getErrors()
      expect(errors).toEqual([])
    })

    it('should return all errors in order', () => {
      errorLogService.addError('Error 1')
      errorLogService.addError('Error 2')
      errorLogService.addError('Error 3')

      const errors = errorLogService.getErrors()
      expect(errors).toHaveLength(3)
      expect(errors[0].message).toBe('Error 1')
      expect(errors[1].message).toBe('Error 2')
      expect(errors[2].message).toBe('Error 3')
    })

    it('should return a copy of errors array', () => {
      errorLogService.addError('Test error')

      const errors1 = errorLogService.getErrors()
      const errors2 = errorLogService.getErrors()

      expect(errors1).not.toBe(errors2)
      expect(errors1).toEqual(errors2)
    })
  })

  describe('clear', () => {
    it('should remove all errors', () => {
      errorLogService.addError('Error 1')
      errorLogService.addError('Error 2')

      errorLogService.clear()

      expect(errorLogService.getErrors()).toEqual([])
    })
  })

  describe('removeError', () => {
    it('should remove error by id', () => {
      const entry1 = errorLogService.addError('Error 1')
      errorLogService.addError('Error 2')

      errorLogService.removeError(entry1.id)

      const errors = errorLogService.getErrors()
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe('Error 2')
    })

    it('should do nothing if id not found', () => {
      errorLogService.addError('Error 1')

      errorLogService.removeError('non-existent-id')

      expect(errorLogService.getErrors()).toHaveLength(1)
    })
  })

  describe('subscribe', () => {
    it('should call listener when error is added', () => {
      const listener = jest.fn()
      errorLogService.subscribe(listener)

      errorLogService.addError('Test error')

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(errorLogService.getErrors())
    })

    it('should call listener when error is removed', () => {
      const entry = errorLogService.addError('Test error')
      const listener = jest.fn()
      errorLogService.subscribe(listener)

      errorLogService.removeError(entry.id)

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should call listener when cleared', () => {
      errorLogService.addError('Test error')
      const listener = jest.fn()
      errorLogService.subscribe(listener)

      errorLogService.clear()

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith([])
    })

    it('should return unsubscribe function', () => {
      const listener = jest.fn()
      const unsubscribe = errorLogService.subscribe(listener)

      unsubscribe()
      errorLogService.addError('Test error')

      expect(listener).not.toHaveBeenCalled()
    })

    it('should support multiple listeners', () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()
      errorLogService.subscribe(listener1)
      errorLogService.subscribe(listener2)

      errorLogService.addError('Test error')

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })
  })
})
