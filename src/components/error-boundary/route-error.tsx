import { useNavigate, useRouteError } from 'react-router-dom';

import ROUTE_PATHS from '@/routes/route-paths';

import ErrorFallback from './error-fallback';

export default function RouteError(): JSX.Element {
  const routeError = useRouteError();
  const navigate = useNavigate();
  const error = routeError instanceof Error ? routeError : undefined;
  const reset = (): void => {
    navigate(ROUTE_PATHS.home);
  };
  return <ErrorFallback error={error} reset={reset} />;
}
