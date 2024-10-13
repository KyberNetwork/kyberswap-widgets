export { default as Widget } from './Widget'
export * from './Widget'

import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'https://50dafb1c10e301e6d4821bff21520cc4@sentry.ops.kyberengineering.io/7',
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  ignoreErrors: ['AbortError'],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  tracesSampleRate: 1.0,

  // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
  // tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
