import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import muiThemeShellLoader from '@/providers/mui-theme/mui-theme-shell-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';

const footerLoader = new ThemedChunkLoader(
  new ChunkRetryLoader(() => import(/* webpackChunkName: "ui-footer" */ '@/components/ui-footer')),
  muiThemeShellLoader
);

export default footerLoader;
