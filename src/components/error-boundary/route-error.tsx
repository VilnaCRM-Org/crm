import type { JSX } from 'react';
import { useRouteError } from 'react-router';

import type { RouteErrorProps } from '@/components/types/error-boundary';

import errorPageStatusDetector from './error-page-status-detector';
import RouteErrorFallback from './route-error-fallback';
import RouteErrorPage from './route-error-page';

export default function RouteError({ landmark }: RouteErrorProps): JSX.Element {
  const variant = errorPageStatusDetector.detect(useRouteError());
  if (variant === null) return <RouteErrorFallback landmark={landmark} />;
  return <RouteErrorPage variant={variant} landmark={landmark} />;
}
