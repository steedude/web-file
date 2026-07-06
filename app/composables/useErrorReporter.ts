import type { AppErrorPayload } from '~/types/error.type'
import { createAppError, serialiseErrorCause } from '~/utils/error.util'

export function useErrorReporter() {
  const runtimeConfig = useRuntimeConfig()

  function captureAppError(payload: AppErrorPayload) {
    const appError = createAppError(payload)
    const sentryConfig = runtimeConfig.public.sentry

    if (import.meta.dev)
      console.error(`[${appError.code}] ${appError.message}`, appError.cause)

    if (!sentryConfig.enabled || !sentryConfig.dsn)
      return appError

    import('@sentry/nuxt').then((Sentry) => {
      Sentry.withScope((scope) => {
        scope.setLevel(appError.severity)
        scope.setTag('app_error_code', appError.code)
        scope.setTag('feature', appError.feature)
        scope.setContext('app_error', {
          code: appError.code,
          context: appError.context,
          feature: appError.feature,
          id: appError.id,
          timestamp: appError.timestamp,
        })

        if (appError.context) {
          for (const [key, value] of Object.entries(appError.context))
            scope.setExtra(key, value)
        }

        scope.setExtra('cause', serialiseErrorCause(appError.cause))
        Sentry.captureException(appError.cause instanceof Error ? appError.cause : new Error(appError.message))
      })
    }).catch(() => {
      console.error(`[${appError.code}] Sentry capture failed.`)
    })

    return appError
  }

  return {
    captureAppError,
  }
}
