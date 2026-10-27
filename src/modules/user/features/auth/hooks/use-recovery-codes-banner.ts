import {
  type ComponentType,
  createElement,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useState,
} from 'react';
import { useLocation } from 'react-router';

import RouteFallback from '@/components/route-fallback';
import type { ComponentModule } from '@/components/types/providers';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import muiThemeShellLoader from '@/providers/mui-theme/mui-theme-shell-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';
import ROUTE_PATHS from '@/routes/route-paths';
import useAuthStore from '@auth/stores/use-auth-store';
import type { AuthState, AuthStatePatch } from '@auth/types/auth-store';
import type { RecoveryCodesNoticeProps } from '@auth/types/two-factor/recovery-codes-notice';

const loadNotice = (): Promise<ComponentModule<RecoveryCodesNoticeProps>> =>
  import(/* webpackChunkName: "recovery-codes-notice" */ '@auth/components/recovery-codes-notice');

function NoticeUnavailable(): null {
  return null;
}

const dismiss = (): void => {
  const patch: AuthStatePatch = { recoveryCodesRemaining: null };
  useAuthStore.setState(patch);
};

export default function useRecoveryCodesBanner(): ReactNode {
  const remaining = useAuthStore((state: AuthState) => state.recoveryCodesRemaining);
  const onSettings = useLocation().pathname === ROUTE_PATHS.settings;
  const [Notice] = useState<ComponentType<RecoveryCodesNoticeProps>>(() =>
    lazy(() =>
      new ThemedChunkLoader<RecoveryCodesNoticeProps>(
        new ChunkRetryLoader(loadNotice),
        muiThemeShellLoader
      )
        .load()
        .catch(() => ({ default: NoticeUnavailable }))
    )
  );

  useEffect(() => {
    if (onSettings && remaining !== null) dismiss();
  });

  if (remaining === null || onSettings) return undefined;
  return createElement(
    Suspense,
    { fallback: createElement(RouteFallback) },
    createElement(Notice, { count: remaining, onDismiss: dismiss })
  );
}
