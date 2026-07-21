import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import RouteFallback from '@/components/route-fallback';

import useRootLayoutDir from './use-root-layout-dir';

export default function RootLayout(): JSX.Element {
  useRootLayoutDir();
  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  );
}
