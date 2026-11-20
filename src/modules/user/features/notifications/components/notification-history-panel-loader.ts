import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';

import type {
  NotificationChunkReporter,
  NotificationHistoryPanelModule,
} from '../types/components';

export class NotificationHistoryPanelLoader {
  private readonly chunk = new ChunkRetryLoader<NotificationHistoryPanelModule>(
    () => import(/* webpackChunkName: "notifications-history" */ './notification-history-panel')
  );

  public load(report: NotificationChunkReporter): Promise<NotificationHistoryPanelModule> {
    return this.chunk.load().catch((error: unknown) => {
      report('app-shell:notifications-history', error);
      const EmptyPanel = (): null => null;

      return { default: EmptyPanel };
    });
  }
}

const notificationHistoryPanelLoader = new NotificationHistoryPanelLoader();

export default notificationHistoryPanelLoader;
