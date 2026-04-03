import React, { lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import ProtectedRoute from '@/components/protected-route';

import './index.css';

const ButtonExample = lazy(async () => import('@/ButtonExample'));
const Authentication = lazy(async () => import('@/modules/User/features/Auth'));

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
    <React.Suspense fallback={null}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </React.Suspense>
  );
}
export default App;
