import { RouterProvider } from 'react-router-dom';

import router from '@/routes/routes';

import './index.css';

export default function App(): JSX.Element {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
