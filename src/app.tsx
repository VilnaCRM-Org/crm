import React, { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import ButtonExample from '@/button-example';

import './index.css';

const Authentication = lazy(() => import('@/modules/user/features/auth'));

const router = createBrowserRouter(
  [
    {
      path: '/authentication',
      element: (
        <Suspense fallback={null}>
          <Authentication />
        </Suspense>
      ),
    },
    {
      path: '/',
      element: <ButtonExample />,
    },
  ]
);

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
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
export default App;
