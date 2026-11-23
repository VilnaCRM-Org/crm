import type ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import type { ShellChunkSource } from '@/routes/types/shell-slot';

import type { NotificationChunkModule, NotificationChunkReporter } from '../types/components';

export default class NotificationChunkLoader<TProps> {
  constructor(
    private readonly source: ShellChunkSource,
    private readonly chunk: ChunkRetryLoader<NotificationChunkModule<TProps>>
  ) {}

  public load(report: NotificationChunkReporter): Promise<NotificationChunkModule<TProps>> {
    return this.chunk.load().catch((error: unknown) => {
      report(this.source, error);
      const EmptyChunk = (): null => null;

      return { default: EmptyChunk };
    });
  }
}
