import type { JSX } from 'react';
import { RouterProvider } from 'react-router';

import router from '@/routes/routes';

import './index.css';

export default function App(): JSX.Element {
  return <RouterProvider router={router} />;
}
