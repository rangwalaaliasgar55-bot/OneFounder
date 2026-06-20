/**
 * Sentry error tracking for OneFounder server.
 * Captures API errors, AI failures, DB errors, auth failures.
 */
import * as Sentry from '@sentry/node'

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('[Sentry] No SENTRY_DSN set — error tracking disabled')
    return
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || `onefoundr@${process.env.npm_package_version || '4.0.0'}`,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,

    beforeSend(event) {
      // Sanitize sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }
      if (event.request?.data && typeof event.request.data === 'object') {
        const data = event.request.data as Record<string, unknown>
        if ('password' in data) data.password = '[REDACTED]'
        if ('token' in data) data.token = '[REDACTED]'
      }
      return event
    },
  })

  console.log('[Sentry] Error tracking initialized')
}

export function captureError(err: Error, context?: {
  userId?: string
  email?: string
  module?: string
  action?: string
  extra?: Record<string, unknown>
}) {
  Sentry.withScope((scope) => {
    if (context?.userId) scope.setUser({ id: context.userId, email: context.email })
    if (context?.module) scope.setTag('module', context.module)
    if (context?.action) scope.setTag('action', context.action)
    if (context?.extra) scope.setExtras(context.extra)
    Sentry.captureException(err)
  })
}

export function captureMessage(msg: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context)
    Sentry.captureMessage(msg, level)
  })
}

export { Sentry }
