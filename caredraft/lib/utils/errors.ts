/**
 * Custom error classes for application-wide error handling
 */

export class BaseError extends Error {
  public readonly code: string
  public readonly statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403)
  }
}

export class ValidationError extends BaseError {
  public readonly field?: string

  constructor(message: string = 'Validation failed', field?: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.field = field
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404)
  }
}

export class ConflictError extends BaseError {
  constructor(message: string = 'Resource conflict') {
    super(message, 'CONFLICT_ERROR', 409)
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429)
  }
}

export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal server error') {
    super(message, 'INTERNAL_SERVER_ERROR', 500)
  }
}

/**
 * Type guard to check if an error is one of our custom errors
 */
export function isCustomError(error: unknown): error is BaseError {
  return error instanceof BaseError
}

/**
 * Get error response data for API responses
 */
export function getErrorResponse(error: unknown) {
  if (isCustomError(error)) {
    return {
      error: error.message,
      code: error.code,
      ...(error instanceof ValidationError && error.field && { field: error.field })
    }
  }

  // Handle unknown errors
  return {
    error: error instanceof Error ? error.message : 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  }
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isCustomError(error)) {
    return error.statusCode
  }
  
  return 500 // Default to internal server error
} 