import type { AppErrorCodes, AppErrorFeatures, AppErrorSeverities } from '~/configs/error-code.config'

export type AppErrorCode = typeof AppErrorCodes[keyof typeof AppErrorCodes]
export type AppErrorFeature = typeof AppErrorFeatures[keyof typeof AppErrorFeatures]
export type AppErrorSeverity = typeof AppErrorSeverities[keyof typeof AppErrorSeverities]

export interface AppErrorPayload {
  code: AppErrorCode
  feature: AppErrorFeature
  severity: AppErrorSeverity
  cause?: unknown
  context?: Record<string, unknown>
}

export interface AppError extends AppErrorPayload {
  id: string
  message: string
  timestamp: string
}
