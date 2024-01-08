import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Authentication from '@/modules/User/features/Auth';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Authentication />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
export default App;
