import 'reflect-metadata';
import { ApolloProvider } from '@apollo/client';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import '@/config/DependencyInjectionConfig';
import ApolloClientSingleton from '@/services/ApolloClient';
import '@/styles/fonts.css';
import theme from '@/styles/theme';

import App from './App';
import i18n from './i18n';

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
        <ApolloProvider client={ApolloClientSingleton.getInstance()}>
          <React.Suspense fallback={null}>
            <App />
          </React.Suspense>
        </ApolloProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
