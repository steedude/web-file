import type { AppError, AppErrorPayload } from '~/types/error.type'
import { AppErrorMessages } from '~/configs/error-code.config'

export function createAppError(payload: AppErrorPayload): AppError {
  return {
    ...payload,
    id: crypto.randomUUID(),
    message: AppErrorMessages[payload.code],
    timestamp: new Date().toISOString(),
  }
}

export function getErrorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback
}

export function serialiseErrorCause(cause: unknown) {
  if (cause instanceof Error) {
    return {
      message: cause.message,
      name: cause.name,
      stack: cause.stack,
    }
  }

  return cause
}
