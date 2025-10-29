import '../sentry.client';

import * as Sentry from '@sentry/react';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import '../styles/globals.css';

async function enableMocks() {
  if (import.meta.env.DEV) {
    const { worker } = await import('../mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}
enableMocks().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Sentry.ErrorBoundary fallback={<div>Something went wrong.</div>}>
        <App />
      </Sentry.ErrorBoundary>
    </React.StrictMode>,
  );
});
