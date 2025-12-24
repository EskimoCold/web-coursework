import '../sentry.client';

import * as Sentry from '@sentry/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
// eslint-disable-next-line import/no-unresolved
import { registerSW } from 'virtual:pwa-register';

import App from './App';
import '../styles/globals.css';

registerSW({
  immediate: true,
  onNeedRefresh() {
    // eslint-disable-next-line no-console
    console.log('New content available, but auto-reload is disabled for dev stability.');
  },
});

const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  if (!rootElement.innerHTML) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <Sentry.ErrorBoundary fallback={<div>Something went wrong.</div>}>
          <App />
        </Sentry.ErrorBoundary>
      </React.StrictMode>,
    );
  }
};

async function enableMocks() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === '1') {
    try {
      const { worker } = await import('../mocks/browser');
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });
    } catch (error) {
      console.warn('Failed to start MSW worker:', error);
    }
  }
}

renderApp();

enableMocks().catch(console.error);
