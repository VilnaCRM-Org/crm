import { StyledEngineProvider } from '@mui/material/styles';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import '@/config/DependencyInjectionConfig';

import Store from '@/stores';

import App from './App';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <Provider store={Store}>
        <App />
      </Provider>
    </StyledEngineProvider>
  </React.StrictMode>
);
