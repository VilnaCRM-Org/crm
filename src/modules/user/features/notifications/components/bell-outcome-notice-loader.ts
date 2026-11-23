import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';

import type { BellOutcomeNoticeModule, BellOutcomeNoticeProps } from '../types/components';

import NotificationChunkLoader from './notification-chunk-loader';

export default new NotificationChunkLoader<BellOutcomeNoticeProps>(
  'app-shell:notifications-notice',
  new ChunkRetryLoader<BellOutcomeNoticeModule>(
    () => import(/* webpackChunkName: "notifications-notice" */ './bell-outcome-notice')
  )
);
