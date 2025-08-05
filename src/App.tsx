import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Authentication from '@/modules/User/features/Auth';

import i18n from './i18n';

import './index.css';

const router = createBrowserRouter([
  {
    path: '/authentication',
    element: <Authentication />,
  },
]);

function App(): React.ReactElement {
  useEffect(() => {
    document.documentElement.dir = i18n.dir?.() || 'ltr';
  }, []);

  return <RouterProvider router={router} />;
}
export default App;
