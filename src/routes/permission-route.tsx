import { lazy, useEffect, useRef } from 'react';
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
  // One refusal is one event. The identity of the refusal — who was refused what, and where —
  // is what the effect keys on, so a principal swapped under a still-mounted denied branch
  // records its own refusal while StrictMode replaying the mount effect for the same one does
  // not. The remount key stays the pathname alone: re-anchoring focus on a change the user did
  // not initiate would be the worse bug.
  const refusal =
    principal !== null && !allowed ? [principal.id, permission, pathname].join(' ') : null;
  const recorded = useRef<string | null>(null);

  useEffect(() => {
    if (refusal === null || recorded.current === refusal) return;
    recorded.current = refusal;
    accessCore.recordDenial(permission, { path: pathname });
  }, [refusal, permission, pathname]);

  if (principal === null) return null;

  return allowed ? <Outlet /> : <AccessDenied key={pathname} />;
}
