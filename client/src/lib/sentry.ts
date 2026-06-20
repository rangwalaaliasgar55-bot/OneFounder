/**
 * Sentry error tracking for OneFounder frontend.
 * Captures React crashes, API failures, unhandled rejections.
 */
import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_SENTRY_RELEASE || 'onefoundr@4.0.0',
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],

    beforeSend(event) {
      // Strip sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
      }
      return event
    },

    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      'cancelled',
    ],
  })
}

export function captureError(err: Error, context?: {
  component?: string
  action?: string
  extra?: Record<string, unknown>
}) {
  Sentry.withScope((scope) => {
    if (context?.component) scope.setTag('component', context.component)
    if (context?.action) scope.setTag('action', context.action)
    if (context?.extra) scope.setExtras(context.extra)
    Sentry.captureException(err)
  })
}

export { Sentry }
