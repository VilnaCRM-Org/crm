import 'reflect-metadata';
import { ApolloProvider } from '@apollo/client';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import '@/config/DependencyInjectionConfig';
import ApolloClientSingleton from '@/services/ApolloClient';
import Store from '@/stores';
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
          <Provider store={Store}>
            <React.Suspense fallback={null}>
              <App />
            </React.Suspense>
          </Provider>
        </ApolloProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
