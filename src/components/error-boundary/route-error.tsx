import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

import ROUTE_PATHS from '@/routes/route-paths';

import ErrorFallback from './error-fallback';

function toError(routeError: unknown): Error {
  if (routeError instanceof Error) return routeError;
  if (isRouteErrorResponse(routeError)) {
    return new Error(`${routeError.status} ${routeError.statusText}`);
  }
  return new Error('Unknown route error');
}

export default function RouteError(): JSX.Element {
  const routeError = useRouteError();
  const navigate = useNavigate();
  const error = toError(routeError);
  const reset = (): void => {
    navigate(ROUTE_PATHS.home);
  };
  return <ErrorFallback error={error} reset={reset} />;
}
