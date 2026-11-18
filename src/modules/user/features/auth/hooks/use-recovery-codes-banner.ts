import {
  type ComponentType,
  createElement,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useState,
} from 'react';
import { matchPath, useLocation } from 'react-router';

import RouteFallback from '@/components/route-fallback';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import muiThemeShellLoader from '@/providers/mui-theme/mui-theme-shell-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';
import ROUTE_PATHS from '@/routes/route-paths';
import useAuthStore from '@auth/stores/use-auth-store';
import useFailureCapture from '@auth/stores/use-failure-capture';
import type { AuthState, AuthStatePatch } from '@auth/types/auth-store';
import type { FailureCapture } from '@auth/types/failure-capture';
import type { RecoveryCodesNoticeProps } from '@auth/types/two-factor/recovery-codes-notice';

function NoticeUnavailable(): null {
  return null;
}

const dismiss = (): void => {
  const patch: AuthStatePatch = { recoveryCodesRemaining: null };
  useAuthStore.setState(patch);
};

function lazyNotice(capture: FailureCapture): ComponentType<RecoveryCodesNoticeProps> {
  const loader = new ThemedChunkLoader<RecoveryCodesNoticeProps>(
    new ChunkRetryLoader(
      () =>
        import(
          /* webpackChunkName: "recovery-codes-notice" */ '@auth/components/recovery-codes-notice'
        )
    ),
    muiThemeShellLoader
  );
  return lazy(() =>
    loader.load().catch((error: unknown) => {
      capture(error);
      return { default: NoticeUnavailable };
    })
  );
}

export default function useRecoveryCodesBanner(): ReactNode {
  const remaining = useAuthStore((state: AuthState) => state.recoveryCodesRemaining);
  const onSettings = matchPath(ROUTE_PATHS.settings, useLocation().pathname) !== null;
  const capture = useFailureCapture('auth:recovery-notice-load');
  const [Notice] = useState(() => lazyNotice(capture));

  useEffect(() => {
    if (onSettings && remaining !== null) dismiss();
  });

  if (remaining === null || onSettings) return undefined;
  return createElement(
    Suspense,
    { fallback: createElement(RouteFallback, { minHeight: '5.125rem' }) },
    createElement(Notice, { count: remaining, onDismiss: dismiss })
  );
}
