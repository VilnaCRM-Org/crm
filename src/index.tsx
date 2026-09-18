import * as React from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/fonts.css';

import ErrorFallback from '@/components/error-boundary/error-fallback';
import UIErrorBoundary from '@/components/error-boundary/ui-error-boundary';
import appConfigSource from '@/config/runtime/app-config-source';
import BrowserConnectivityAdapter from '@/lib/connectivity/browser-connectivity-adapter';
import connectivityStateVar from '@/lib/connectivity/connectivity-state-var';
import pageReloadNavigator from '@/lib/reliability/page-reload-navigator';
import type { RecoverableError } from '@/lib/reliability/types/recoverable-error';
import AppProviders from '@/providers/app-providers';
import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';
import observabilityCore from '@/services/observability/observability-core';

import App from './app';
import i18n from './i18n';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(i18n.t('root_element_missing'));
}

const root = createRoot(rootElement);

observabilityCore.init();
new BrowserConnectivityAdapter(connectivityStateVar).attach(window);

const BOOTSTRAP_RECOVERY: RecoverableError = {
  recoverable: true,
  strategy: 'reload',
  messageKey: 'error_boundary.bootstrap',
  severity: 'fatal',
};

const reloadPage = (): void => {
  pageReloadNavigator.reload();
};

// Parse the runtime configuration before rendering so a malformed deployment fails loudly here
// instead of silently degrading to defaults (issue #145). This is a synchronous read of the
// inline JSON block in the HTML shell — no fetch, no await, no paint-path cost. An unhandled
// throw would leave an empty #root, which a screen reader cannot distinguish from "still
// loading", so the failure is rendered through the shell's own accessible error fallback.
let configError: Error | undefined;

try {
  appConfigSource.load();
} catch (cause) {
  configError = cause instanceof Error ? cause : new Error(String(cause));
  observabilityCore.report(configError, { source: 'bootstrap:runtime-config' });
}

if (configError) {
  root.render(
    <ErrorFallback
      error={configError}
      recovery={BOOTSTRAP_RECOVERY}
      reset={reloadPage}
      reload={reloadPage}
    />
  );
} else {
  root.render(
    <React.StrictMode>
      <UIErrorBoundary surface="app" reporter={boundaryErrorReporter}>
        <AppProviders>
          <App />
        </AppProviders>
      </UIErrorBoundary>
    </React.StrictMode>
  );
}
