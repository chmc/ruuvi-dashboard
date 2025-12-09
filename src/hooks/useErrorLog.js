import { useState, useEffect, useCallback } from 'react'
import errorLogService from '../services/errorLog'

/**
 * Custom hook to access the error log
 * @returns {{
 *   errors: import('../services/errorLog').ErrorLogEntry[],
 *   clearErrors: function(): void
 * }}
 */
const useErrorLog = () => {
  const [errors, setErrors] = useState(() => errorLogService.getErrors())

  useEffect(() => {
    const unsubscribe = errorLogService.subscribe((newErrors) => {
      setErrors(newErrors)
    })

    return unsubscribe
  }, [])

  const clearErrors = useCallback(() => {
    errorLogService.clear()
  }, [])

  return { errors, clearErrors }
}

export default useErrorLog
