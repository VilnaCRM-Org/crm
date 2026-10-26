import type { UIAppShellProps } from '@/components/types/ui-app-shell';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import muiThemeShellLoader from '@/providers/mui-theme/mui-theme-shell-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';

const appShellLoader = new ThemedChunkLoader<UIAppShellProps>(
  new ChunkRetryLoader(
    () => import(/* webpackChunkName: "ui-app-shell" */ '@/components/ui-app-shell')
  ),
  muiThemeShellLoader
);

export default appShellLoader;
