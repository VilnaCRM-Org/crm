import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';

const footerLoader = new ChunkRetryLoader(
  () => import(/* webpackChunkName: "ui-footer" */ '@/components/ui-footer')
);

export default footerLoader;
