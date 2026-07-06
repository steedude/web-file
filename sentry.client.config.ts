import * as Sentry from '@sentry/nuxt'

const runtimeConfig = useRuntimeConfig()
const sentryConfig = runtimeConfig.public.sentry

if (sentryConfig.enabled && sentryConfig.dsn) {
  Sentry.init({
    dsn: sentryConfig.dsn,
  })
}
