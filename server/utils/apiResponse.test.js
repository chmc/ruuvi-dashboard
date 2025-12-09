/**
 * @file Tests for API response envelope helpers
 */
const { success, error, errorFromException } = require('./apiResponse')

describe('apiResponse', () => {
  describe('success', () => {
    it('should create a success response with data', () => {
      const data = { temperature: 21.5, humidity: 45 }
      const response = success(data)

      expect(response).toEqual({
        success: true,
        data: { temperature: 21.5, humidity: 45 },
      })
    })

    it('should create a success response with array data', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const response = success(data)

      expect(response).toEqual({
        success: true,
        data: [{ id: 1 }, { id: 2 }],
      })
    })

    it('should create a success response with null data', () => {
      const response = success(null)

      expect(response).toEqual({
        success: true,
        data: null,
      })
    })

    it('should create a success response with empty object', () => {
      const response = success({})

      expect(response).toEqual({
        success: true,
        data: {},
      })
    })

    it('should create a success response with primitive data', () => {
      expect(success(42)).toEqual({ success: true, data: 42 })
      expect(success('hello')).toEqual({ success: true, data: 'hello' })
      expect(success(true)).toEqual({ success: true, data: true })
    })
  })

  describe('error', () => {
    it('should create an error response with message only', () => {
      const response = error('Something went wrong')

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Something went wrong',
        },
      })
    })

    it('should create an error response with message and code', () => {
      const response = error('Resource not found', 'NOT_FOUND')

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Resource not found',
          code: 'NOT_FOUND',
        },
      })
    })

    it('should create an error response with all parameters', () => {
      const details = { field: 'mac', reason: 'required' }
      const response = error('Validation failed', 'VALIDATION_ERROR', details)

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { field: 'mac', reason: 'required' },
        },
      })
    })

    it('should omit code if not provided', () => {
      const response = error('Error occurred')

      expect(response.error).not.toHaveProperty('code')
    })

    it('should omit details if not provided', () => {
      const response = error('Error occurred', 'SOME_CODE')

      expect(response.error).not.toHaveProperty('details')
    })
  })

  describe('errorFromException', () => {
    it('should create error response from Error object', () => {
      const err = new Error('Database connection failed')
      const response = errorFromException(err)

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Database connection failed',
        },
      })
    })

    it('should create error response with custom message', () => {
      const err = new Error('Internal details')
      const response = errorFromException(err, 'Failed to process request')

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Failed to process request',
        },
      })
    })

    it('should create error response with code', () => {
      const err = new Error('Not found')
      const response = errorFromException(err, 'Resource not found', 'NOT_FOUND')

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Resource not found',
          code: 'NOT_FOUND',
        },
      })
    })

    it('should handle non-Error objects', () => {
      const response = errorFromException('string error')

      expect(response).toEqual({
        success: false,
        error: {
          message: 'string error',
        },
      })
    })

    it('should handle null/undefined errors', () => {
      expect(errorFromException(null)).toEqual({
        success: false,
        error: {
          message: 'Unknown error',
        },
      })

      expect(errorFromException(undefined)).toEqual({
        success: false,
        error: {
          message: 'Unknown error',
        },
      })
    })

    it('should handle objects with message property', () => {
      const response = errorFromException({ message: 'Custom error object' })

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Custom error object',
        },
      })
    })
  })
})
