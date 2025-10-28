import * as Sentry from '@sentry/react';
import React from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

const isProd = import.meta.env.PROD;

if (isProd) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
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

    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.02,
    replaysOnErrorSampleRate: 1.0,
  });
}
