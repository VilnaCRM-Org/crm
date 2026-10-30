import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';

const currentUserMenuLoader = new ChunkRetryLoader(
  () => import(/* webpackChunkName: "current-user" */ './current-user-menu')
);

export default currentUserMenuLoader;
