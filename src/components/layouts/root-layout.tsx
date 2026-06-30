import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import useRootLayoutDir from './use-root-layout-dir';

export default function RootLayout(): JSX.Element {
  useRootLayoutDir();
  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  );
}
