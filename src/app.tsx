import "reflect-metadata"

import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import React, { lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './index.css';
import '@/config/fonts/golos.css';
import '@/config/fonts/inter.css';

import ProtectedRoute from '@/components/protected-route';
import store from '@/stores';
import theme from '@/styles/theme';

const Authentication = lazy(async () => import('@/modules/user/features/auth'));
const ButtonExample = lazy(async () => import('@/button-example'));

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: (
            <ButtonExample />
        ),
      },
    ],
  },
  {
    path: '/authentication',
    element: <Authentication />,
  },
]);

function App(): React.ReactElement {
  const { i18n } = useTranslation();

  useEffect(() => {
    const applyDir = (): void => {
      document.documentElement.dir = i18n.dir?.(i18n.language) || 'ltr';
    };
    applyDir();
    i18n.on?.('languageChanged', applyDir);
    return (): void => i18n.off?.('languageChanged', applyDir);
  }, [i18n]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Provider store={store}>
          <React.Suspense fallback={null}>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
          </React.Suspense>
        </Provider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
export default App;
