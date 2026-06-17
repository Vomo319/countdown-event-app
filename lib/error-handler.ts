// Error handling and logging utilities for the app

export class AppError extends Error {
  constructor(
    public message: string,
    public code: string = 'APP_ERROR',
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const ErrorCodes = {
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  SHARE_FAILED: 'SHARE_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const

export function logError(error: any, context: string) {
  const timestamp = new Date().toISOString()
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[v0] [${timestamp}] ${context}:`, message)
  
  // You can send this to a logging service in production
  if (typeof window !== 'undefined' && window.__errorLog) {
    window.__errorLog.push({
      timestamp,
      context,
      message,
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}

export function handleError(error: any, userMessage: string = 'Something went wrong'): string {
  if (error instanceof AppError) {
    logError(error, `AppError: ${error.code}`)
    return error.message
  }
  
  if (error instanceof Error) {
    logError(error, 'UnhandledError')
    return userMessage
  }
  
  logError(error, 'UnknownError')
  return userMessage
}

export function createSuccessNotification(message: string) {
  return {
    type: 'success',
    message,
    timestamp: Date.now(),
  }
}

export function createErrorNotification(message: string, error?: any) {
  if (error) {
    logError(error, 'Notification')
  }
  return {
    type: 'error',
    message,
    timestamp: Date.now(),
  }
}
