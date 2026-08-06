import { lazy, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import useCan from '@/hooks/use-can';
import usePrincipal from '@/hooks/use-principal';
import accessCore from '@/lib/access/access-core';

import type { PermissionRouteProps } from './types/permission-route';

// Code-split: the refusal panel pulls MUI primitives that would otherwise ship in the
// eager entrypoint for a screen almost nobody sees. It resolves inside the RootLayout
// Suspense boundary, which already owns the route-level fallback.
const AccessDenied = lazy(
  () => import(/* webpackChunkName: "access-denied" */ '@/components/access-denied')
);

export default function PermissionRoute({ permission }: PermissionRouteProps): JSX.Element | null {
  const principal = usePrincipal();
  const allowed = useCan(permission);
  const { pathname } = useLocation();
  const denied = principal !== null && !allowed;

  useEffect(() => {
    if (denied) accessCore.recordDenial(permission, { path: pathname });
  }, [denied, permission, pathname]);

  if (principal === null) return null;

  return allowed ? <Outlet /> : <AccessDenied key={pathname} />;
}
