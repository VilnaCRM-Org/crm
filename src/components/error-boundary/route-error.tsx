import { type JSX, useCallback } from 'react';
import { isRouteErrorResponse, useLocation, useNavigate, useRouteError } from 'react-router';

import type { RouteErrorProps } from '@/components/types/error-boundary';
import pageReloadNavigator from '@/lib/reliability/page-reload-navigator';
import recoveryStrategyDetector from '@/lib/reliability/recovery-strategy-detector';

import ErrorFallback from './error-fallback';

function toError(routeError: unknown): Error {
  if (routeError instanceof Error) return routeError;
  if (isRouteErrorResponse(routeError)) {
    return new Error(`${routeError.status} ${routeError.statusText}`);
  }
  return new Error('Unknown route error');
}

const reloadPage = (): void => {
  pageReloadNavigator.reload();
};

const focusMainWhenFocusWasLost = (): void => {
  if (document.activeElement !== document.body) return;
  document.querySelector<HTMLElement>('main[tabindex="-1"]')?.focus();
};

export default function RouteError({ landmark }: RouteErrorProps): JSX.Element {
  const routeError = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();
  const recovery = recoveryStrategyDetector.classify(routeError);
  const { pathname, search, hash, state, key } = location;
  const reset = useCallback((): void => {
    navigate({ pathname, search, hash }, { replace: true, state });
    window.requestAnimationFrame(focusMainWhenFocusWasLost);
  }, [navigate, pathname, search, hash, state]);

  return (
    <ErrorFallback
      key={key}
      error={toError(routeError)}
      recovery={recovery}
      reset={reset}
      reload={reloadPage}
      landmark={landmark}
    />
  );
}
