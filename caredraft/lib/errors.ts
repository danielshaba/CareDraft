// Application Error Classes
// =========================

export class AIError extends Error {
  code: string
  statusCode?: number

  constructor(message: string, code: string = 'AI_ERROR', statusCode?: number) {
    super(message)
    this.name = 'AIError'
    this.code = code
    this.statusCode = statusCode
  }
}

export class ValidationError extends Error {
  code: string = 'VALIDATION_ERROR'
  statusCode: number = 400

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Error {
  code: string = 'DATABASE_ERROR'
  statusCode: number = 500

  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
} 