import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import ButtonExample from '@/ButtonExample';
import Authentication from '@/modules/User/features/Auth';

import './index.css';

const router = createBrowserRouter([
  {
    path: '/authentication',
    element: <Authentication />,
  },
  {
    path: '/',
    element: <ButtonExample />,
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
  return <RouterProvider router={router} />;
}
export default App;
