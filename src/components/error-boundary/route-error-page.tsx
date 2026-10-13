import { type ComponentType, type JSX, lazy, Suspense } from 'react';
import { useLocation } from 'react-router';

import RouteFallback from '@/components/route-fallback';
import type { ErrorPageProps } from '@/components/types/error-page';

import errorPageLoader from './error-page-loader';
import RouteErrorFallback from './route-error-fallback';

function ErrorPageUnavailable({ landmark }: ErrorPageProps): JSX.Element {
  return <RouteErrorFallback landmark={landmark} />;
}

const LazyErrorPage = lazy<ComponentType<ErrorPageProps>>(() =>
  errorPageLoader.load().catch(() => ({ default: ErrorPageUnavailable }))
);

export default function RouteErrorPage({ variant, landmark }: ErrorPageProps): JSX.Element {
  const { key } = useLocation();

  return (
    <Suspense fallback={<RouteFallback />}>
      <LazyErrorPage key={key} variant={variant} landmark={landmark} />
    </Suspense>
  );
}
