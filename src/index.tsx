import 'reflect-metadata';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import '@/config/DependencyInjectionConfig';
import '@/styles/fonts.css';
import App from '@/App';
import i18n from '@/i18n';
import theme from '@/styles/theme';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(i18n.t('root_element_missing'));
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <React.Suspense fallback={null}>
          <App />
        </React.Suspense>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
