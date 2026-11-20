import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';

import type { BellOutcomeNoticeModule, NotificationChunkReporter } from '../types/components';

export class BellOutcomeNoticeLoader {
  private readonly chunk = new ChunkRetryLoader<BellOutcomeNoticeModule>(
    () => import(/* webpackChunkName: "notifications-notice" */ './bell-outcome-notice')
  );

  public load(report: NotificationChunkReporter): Promise<BellOutcomeNoticeModule> {
    return this.chunk.load().catch((error: unknown) => {
      report('app-shell:notifications-notice', error);
      const EmptyNotice = (): null => null;

      return { default: EmptyNotice };
    });
  }
}

const bellOutcomeNoticeLoader = new BellOutcomeNoticeLoader();

export default bellOutcomeNoticeLoader;
