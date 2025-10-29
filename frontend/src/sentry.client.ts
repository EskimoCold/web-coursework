import * as Sentry from '@sentry/react';
import React from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

const isProd = import.meta.env.PROD;
const enabled = isProd || import.meta.env.VITE_SENTRY_ENABLED === '1';
const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined) || undefined;

if (enabled && dsn) {
  Sentry.init({
    dsn,
    release: import.meta.env.VITE_RELEASE,
    environment: import.meta.env.VITE_ENV ?? (isProd ? 'production' : 'development'),
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: Number(import.meta.env.VITE_TRACES_SAMPLE_RATE ?? 0.1),
    replaysSessionSampleRate: Number(import.meta.env.VITE_REPLAYS_SESSION_SAMPLE_RATE ?? 0.02),
    replaysOnErrorSampleRate: Number(import.meta.env.VITE_REPLAYS_ON_ERROR_SAMPLE_RATE ?? 1.0),
    debug: import.meta.env.VITE_SENTRY_DEBUG === '1',
  });

  if (import.meta.env.VITE_SENTRY_SMOKE === '1') {
    Sentry.captureMessage('frontend init smoke');
  }
} else if (enabled && !dsn) {
  console.warn('[sentry] enabled but VITE_SENTRY_DSN is missing');
}
