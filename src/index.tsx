import 'reflect-metadata';

import * as React from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/fonts.css';

import AppErrorBoundary from '@/components/error-boundary/app-error-boundary';
import AppProviders from '@/providers/app-providers';

import App from './app';
import i18n from './i18n';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(i18n.t('root_element_missing'));
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </AppErrorBoundary>
  </React.StrictMode>
);
