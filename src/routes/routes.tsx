import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import RouteError from '@/components/error-boundary/route-error';
import AppLayout from '@/components/layouts/app-layout';
import RootLayout from '@/components/layouts/root-layout';
import routeManifest from '@/routes/route-manifest';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RouteDefinition } from '@/routes/types/route-definition';
import ProtectedRoute from '@auth/components/protected-route';

const toRoute = (definition: RouteDefinition): RouteObject => {
  const Page = lazy(definition.load);
  const element = (
    <Suspense fallback={definition.fallback}>
      <Page />
    </Suspense>
  );
  return definition.index ? { index: true, element } : { path: definition.path, element };
};

const guardedRoutes = routeManifest.filter((route) => route.protected).map(toRoute);
const publicRoutes = routeManifest.filter((route) => !route.protected).map(toRoute);

const router = createBrowserRouter([
  {
    path: ROUTE_PATHS.home,
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [{ element: <AppLayout />, children: guardedRoutes }],
      },
      ...publicRoutes,
    ],
  },
]);

export default router;
