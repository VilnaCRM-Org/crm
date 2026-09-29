import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';

const muiThemeShellLoader = new ChunkRetryLoader(
  () => import(/* webpackChunkName: "mui-theme" */ './mui-theme-shell')
);

export default muiThemeShellLoader;
