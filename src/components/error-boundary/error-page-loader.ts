import type { ErrorPageProps } from '@/components/types/error-page';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import muiThemeShellLoader from '@/providers/mui-theme/mui-theme-shell-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';

const errorPageLoader = new ThemedChunkLoader<ErrorPageProps>(
  new ChunkRetryLoader(
    () => import(/* webpackChunkName: "error-page" */ '@/components/error-page')
  ),
  muiThemeShellLoader
);

export default errorPageLoader;
