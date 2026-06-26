import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import RouteError from '@/components/error-boundary/route-error';
import AppLayout from '@/components/layouts/app-layout';
import RootLayout from '@/components/layouts/root-layout';
import NotFound from '@/components/not-found/not-found';
import ROUTE_PATHS from '@/routes/route-paths';
import ProtectedRoute from '@auth/components/protected-route';

const ButtonExample = lazy(async () => import('@/button-example'));
const SignUp = lazy(async () => import('@auth/routes/sign-up'));
const SignIn = lazy(async () => import('@auth/routes/sign-in'));

const router = createBrowserRouter([
  {
    path: ROUTE_PATHS.home,
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [{ index: true, element: <ButtonExample /> }],
          },
        ],
      },
      { path: ROUTE_PATHS.signUp, element: <SignUp /> },
      { path: ROUTE_PATHS.signIn, element: <SignIn /> },
      { path: ROUTE_PATHS.notFound, element: <NotFound /> },
    ],
  },
]);

export default router;
