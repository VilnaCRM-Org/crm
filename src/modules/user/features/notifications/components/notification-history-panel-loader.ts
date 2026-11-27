import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';

import type {
  NotificationHistoryPanelModule,
  NotificationHistoryPanelProps,
} from '../types/components';

import NotificationChunkLoader from './notification-chunk-loader';

export default new NotificationChunkLoader<NotificationHistoryPanelProps>(
  'app-shell:notifications-history',
  new ChunkRetryLoader<NotificationHistoryPanelModule>(
    () => import(/* webpackChunkName: "notifications-history" */ './notification-history-panel')
  )
);
