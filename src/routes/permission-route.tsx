import { lazy } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import useCan from '@/hooks/use-can';
import useDenialAudit from '@/hooks/use-denial-audit';
import usePrincipal from '@/hooks/use-principal';

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
  // A principal swapped under a still-mounted denied branch was refused too, so it is part
  // of the refusal's identity. The remount key below stays the pathname alone: re-anchoring
  // focus on a change the user did not initiate would be the worse bug.
  const refusal =
    principal !== null && !allowed ? [principal.id, permission, pathname].join(' ') : null;

  useDenialAudit(refusal, permission, pathname);

  if (principal === null) return null;

  return allowed ? <Outlet /> : <AccessDenied key={pathname} />;
}
