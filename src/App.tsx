import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Authentication from '@/modules/User/features/Auth';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/authentication',
    element: <Authentication />,
  },
]);

function App(): React.ReactElement {
  return <RouterProvider router={router} />;
}
export default App;
