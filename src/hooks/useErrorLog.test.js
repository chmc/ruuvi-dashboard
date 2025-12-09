import { renderHook, act } from '@testing-library/react'
import useErrorLog from './useErrorLog'
import errorLogService from '../services/errorLog'

describe('useErrorLog', () => {
  beforeEach(() => {
    errorLogService.clear()
  })

  it('should return current errors', () => {
    errorLogService.addError('Test error')

    const { result } = renderHook(() => useErrorLog())

    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].message).toBe('Test error')
  })

  it('should update when new error is added', () => {
    const { result } = renderHook(() => useErrorLog())

    expect(result.current.errors).toHaveLength(0)

    act(() => {
      errorLogService.addError('New error')
    })

    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].message).toBe('New error')
  })

  it('should update when error is removed', () => {
    const entry = errorLogService.addError('Test error')
    const { result } = renderHook(() => useErrorLog())

    expect(result.current.errors).toHaveLength(1)

    act(() => {
      errorLogService.removeError(entry.id)
    })

    expect(result.current.errors).toHaveLength(0)
  })

  it('should update when errors are cleared', () => {
    errorLogService.addError('Error 1')
    errorLogService.addError('Error 2')
    const { result } = renderHook(() => useErrorLog())

    expect(result.current.errors).toHaveLength(2)

    act(() => {
      errorLogService.clear()
    })

    expect(result.current.errors).toHaveLength(0)
  })

  it('should provide clearErrors function', () => {
    errorLogService.addError('Test error')
    const { result } = renderHook(() => useErrorLog())

    act(() => {
      result.current.clearErrors()
    })

    expect(result.current.errors).toHaveLength(0)
  })

  it('should unsubscribe on unmount', () => {
    const { result, unmount } = renderHook(() => useErrorLog())

    expect(result.current.errors).toHaveLength(0)

    unmount()

    // This should not cause an update error
    act(() => {
      errorLogService.addError('Test error')
    })
  })
})
