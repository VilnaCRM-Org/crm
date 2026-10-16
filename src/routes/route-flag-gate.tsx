import type { JSX } from 'react';
import { Outlet, type UIMatch, useMatches } from 'react-router';

import featureFlagService from '@/config/runtime/feature-flag-service';

import type { RouteHandle } from './types/app-route';
import type { RouteFlagGateProps } from './types/route-flag-gate';

export default function RouteFlagGate({ notFound }: RouteFlagGateProps): JSX.Element {
  const matches = useMatches() as UIMatch<unknown, RouteHandle | undefined>[];
  const off = matches.some(
    ({ handle }) => handle?.flag !== undefined && !featureFlagService.isEnabled(handle.flag)
  );

  return off ? <>{notFound}</> : <Outlet />;
}
