import React, { lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import ProtectedRoute from '@auth/components/protected-route';

import './index.css';

const ButtonExample = lazy(async () => import('@/button-example'));
const SignUp = lazy(async () => import('@auth/routes/sign-up'));
const SignIn = lazy(async () => import('@auth/routes/sign-in'));

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <ButtonExample />,
      },
    ],
  },
  {
    path: '/sign-up',
    element: <SignUp />,
  },
  {
    path: '/sign-in',
    element: <SignIn />,
  },
]);

function App(): React.ReactElement {
  const { i18n } = useTranslation();

  useEffect(() => {
    const applyHtmlAttrs = (): void => {
      document.documentElement.dir = i18n.dir?.(i18n.language) || 'ltr';
      document.documentElement.lang = i18n.language;
    };
    applyHtmlAttrs();
    i18n.on?.('languageChanged', applyHtmlAttrs);
    return (): void => i18n.off?.('languageChanged', applyHtmlAttrs);
  }, [i18n]);
  return (
    <React.Suspense fallback={null}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </React.Suspense>
  );
}
export default App;
