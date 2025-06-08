import { 
  AuthenticationError, 
  AuthorizationError, 
  ValidationError, 
  NotFoundError,
  getErrorResponse,
  getErrorStatusCode 
} from '@/lib/utils/errors'

describe('Error Handling Integration Tests', () => {
  describe('Custom Error Classes', () => {
    it('should create AuthenticationError with correct properties', () => {
      // Arrange & Act
      const error = new AuthenticationError('Authentication required')

      // Assert
      expect(error.name).toBe('AuthenticationError')
      expect(error.message).toBe('Authentication required')
      expect(error.code).toBe('AUTHENTICATION_ERROR')
      expect(error.statusCode).toBe(401)
      expect(error instanceof Error).toBe(true)
    })

    it('should create AuthorizationError with correct properties', () => {
      // Arrange & Act
      const error = new AuthorizationError('Access denied')

      // Assert
      expect(error.name).toBe('AuthorizationError')
      expect(error.message).toBe('Access denied')
      expect(error.code).toBe('AUTHORIZATION_ERROR')
      expect(error.statusCode).toBe(403)
    })

    it('should create ValidationError with correct properties', () => {
      // Arrange & Act
      const error = new ValidationError('Invalid input data')

      // Assert
      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Invalid input data')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(400)
    })

    it('should create NotFoundError with correct properties', () => {
      // Arrange & Act
      const error = new NotFoundError('Resource not found')

      // Assert
      expect(error.name).toBe('NotFoundError')
      expect(error.message).toBe('Resource not found')
      expect(error.code).toBe('NOT_FOUND_ERROR')
      expect(error.statusCode).toBe(404)
    })
  })

  describe('Error Response Generation', () => {
    it('should generate correct response for AuthenticationError', () => {
      // Arrange
      const error = new AuthenticationError('Authentication required')

      // Act
      const response = getErrorResponse(error)

      // Assert
      expect(response).toEqual({
        error: 'Authentication required',
        code: 'AUTHENTICATION_ERROR'
      })
    })

    it('should generate correct response for ValidationError', () => {
      // Arrange
      const error = new ValidationError('Invalid email format')

      // Act
      const response = getErrorResponse(error)

      // Assert
      expect(response).toEqual({
        error: 'Invalid email format',
        code: 'VALIDATION_ERROR'
      })
    })

    it('should generate generic response for unknown errors', () => {
      // Arrange
      const error = new Error('Something went wrong')

      // Act
      const response = getErrorResponse(error)

      // Assert
      expect(response).toEqual({
        error: 'Something went wrong',
        code: 'UNKNOWN_ERROR'
      })
    })

    it('should handle null/undefined errors', () => {
      // Act
      const response1 = getErrorResponse(null)
      const response2 = getErrorResponse(undefined)

      // Assert
      expect(response1).toEqual({
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      })
      expect(response2).toEqual({
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      })
    })

    it('should include field information for ValidationError with field', () => {
      // Arrange
      const error = new ValidationError('Email is required', 'email')

      // Act
      const response = getErrorResponse(error)

      // Assert
      expect(response).toEqual({
        error: 'Email is required',
        code: 'VALIDATION_ERROR',
        field: 'email'
      })
    })
  })

  describe('Status Code Generation', () => {
    it('should return correct status codes for custom errors', () => {
      // Arrange
      const authError = new AuthenticationError('Auth required')
      const authzError = new AuthorizationError('Access denied')
      const validationError = new ValidationError('Invalid data')
      const notFoundError = new NotFoundError('Not found')

      // Act & Assert
      expect(getErrorStatusCode(authError)).toBe(401)
      expect(getErrorStatusCode(authzError)).toBe(403)
      expect(getErrorStatusCode(validationError)).toBe(400)
      expect(getErrorStatusCode(notFoundError)).toBe(404)
    })

    it('should return 500 for generic errors', () => {
      // Arrange
      const genericError = new Error('Something went wrong')

      // Act
      const statusCode = getErrorStatusCode(genericError)

      // Assert
      expect(statusCode).toBe(500)
    })

    it('should return 500 for null/undefined errors', () => {
      // Act & Assert
      expect(getErrorStatusCode(null)).toBe(500)
      expect(getErrorStatusCode(undefined)).toBe(500)
    })
  })

  describe('Error Chain Handling', () => {
    it('should handle nested error scenarios', () => {
      // Arrange
      const originalError = new Error('Database connection failed')
      const wrappedError = new AuthenticationError('Authentication failed due to database error')

      // Act
      const response1 = getErrorResponse(originalError)
      const response2 = getErrorResponse(wrappedError)
      const statusCode1 = getErrorStatusCode(originalError)
      const statusCode2 = getErrorStatusCode(wrappedError)

      // Assert
      expect(response1.error).toBe('Database connection failed')
      expect(response2.error).toBe('Authentication failed due to database error')
      expect(statusCode1).toBe(500)
      expect(statusCode2).toBe(401)
    })

    it('should maintain error context in API responses', () => {
      // Arrange
      const errors = [
        new AuthenticationError('Token expired'),
        new AuthorizationError('Insufficient permissions'),
        new ValidationError('Email is required'),
        new NotFoundError('User not found')
      ]

      // Act & Assert
      errors.forEach(error => {
        const response = getErrorResponse(error)
        const statusCode = getErrorStatusCode(error)

        expect(response.error).toBe(error.message)
        expect(response.code).toBe(error.code)
        expect(statusCode).toBe(error.statusCode)
      })
    })
  })

  describe('Integration with API Error Handling', () => {
    it('should provide consistent error format for API responses', () => {
      // Arrange
      const testCases = [
        {
          error: new AuthenticationError('Invalid token'),
          expectedStatus: 401,
          expectedCode: 'AUTHENTICATION_ERROR'
        },
        {
          error: new ValidationError('Missing required field'),
          expectedStatus: 400,
          expectedCode: 'VALIDATION_ERROR'
        },
        {
          error: new NotFoundError('Organization not found'),
          expectedStatus: 404,
          expectedCode: 'NOT_FOUND_ERROR'
        }
      ]

      // Act & Assert
      testCases.forEach(({ error, expectedStatus, expectedCode }) => {
        const response = getErrorResponse(error)
        const statusCode = getErrorStatusCode(error)

        expect(response).toMatchObject({
          error: error.message,
          code: expectedCode
        })
        expect(statusCode).toBe(expectedStatus)
      })
    })

    it('should handle error logging scenarios', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new AuthenticationError('Test error for logging')

      // Act
      const response = getErrorResponse(error)
      
      // Simulate logging (this would typically happen in the API route)
      console.error('API Error:', error)

      // Assert
      expect(response.error).toBe('Test error for logging')
      expect(response.code).toBe('AUTHENTICATION_ERROR')
      expect(consoleSpy).toHaveBeenCalledWith('API Error:', error)

      // Cleanup
      consoleSpy.mockRestore()
    })
  })
}) 