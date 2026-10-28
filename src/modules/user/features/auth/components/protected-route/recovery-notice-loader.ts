import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import muiThemeShellLoader from '@/providers/mui-theme/mui-theme-shell-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';
import type { RecoveryCodesNoticeProps } from '@auth/types/two-factor/recovery-codes-notice';

const recoveryNoticeLoader = new ThemedChunkLoader<RecoveryCodesNoticeProps>(
  new ChunkRetryLoader(
    () =>
      import(
        /* webpackChunkName: "recovery-codes-notice" */ '@auth/components/recovery-codes-notice'
      )
  ),
  muiThemeShellLoader
);

export default recoveryNoticeLoader;
