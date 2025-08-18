import { AppErrorHandler, errorHandler, handleQueryError } from '@/lib/errorHandler'

describe('ErrorHandler', () => {
  beforeEach(() => {
    // Clear error history before each test
    errorHandler.clearErrorHistory()
  })

  describe('logError', () => {
    it('should log a standard Error', () => {
      const error = new Error('Test error')
      const appError = errorHandler.logError(error, 'test context')

      expect(appError.code).toBe('Error')
      expect(appError.message).toBe('Test error')
      expect(appError.details.context).toBe('test context')
      expect(appError.timestamp).toBeInstanceOf(Date)
    })

    it('should log an unknown error', () => {
      const error = 'String error'
      const appError = errorHandler.logError(error, 'test context')

      expect(appError.code).toBe('UnknownError')
      expect(appError.message).toBe('String error')
      expect(appError.details.context).toBe('test context')
    })

    it('should store errors in history', () => {
      const error1 = new Error('First error')
      const error2 = new Error('Second error')

      errorHandler.logError(error1)
      errorHandler.logError(error2)

      const history = errorHandler.getErrorHistory()
      expect(history).toHaveLength(2)
      expect(history[0].message).toBe('First error')
      expect(history[1].message).toBe('Second error')
    })
  })

  describe('getUserMessage', () => {
    it('should return user-friendly message for network errors', () => {
      const error = new Error('Failed to fetch')
      const message = errorHandler.getUserMessage(error)

      expect(message).toBe('インターネット接続を確認してください。')
    })

    it('should return user-friendly message for auth errors', () => {
      const error = new Error('Unauthorized 401')
      const message = errorHandler.getUserMessage(error)

      expect(message).toBe('ログインが必要です。再度ログインしてください。')
    })

    it('should return generic message for unknown errors', () => {
      const error = new Error('Some random error')
      const message = errorHandler.getUserMessage(error)

      expect(message).toBe('Some random error')
    })

    it('should return default message for non-error objects', () => {
      const message = errorHandler.getUserMessage({ some: 'object' })

      expect(message).toBe('エラーが発生しました。しばらく時間をおいてから再度お試しください。')
    })
  })

  describe('clearErrorHistory', () => {
    it('should clear error history', () => {
      errorHandler.logError(new Error('Test error'))
      expect(errorHandler.getErrorHistory()).toHaveLength(1)

      errorHandler.clearErrorHistory()
      expect(errorHandler.getErrorHistory()).toHaveLength(0)
    })
  })

  describe('handleQueryError', () => {
    it('should handle and return user message', () => {
      const error = new Error('Query failed')
      const message = handleQueryError(error, 'query context')

      expect(message).toBe('Query failed')
      expect(errorHandler.getErrorHistory()).toHaveLength(1)
    })
  })
})