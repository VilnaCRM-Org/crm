import chunkLoadErrorDetector from './chunk-load-error-detector';
import type ChunkRetryLoader from './chunk-retry-loader';
import pageReloadNavigator from './page-reload-navigator';
import type ReloadOnceGuard from './reload-once-guard';

// The recovery of last resort for a page chunk that is still missing after the retry: one full
// navigation, so the browser fetches the current deploy's manifest. It is reserved for public
// routes — the auth token lives in memory only, so a reload on a protected route would sign the
// user out to fix a chunk (ADR-007). The reload happens at most once per key and session; a
// second miss reaches the route's error boundary, which offers the reload as a button instead.
export default class ReloadingChunkLoader<TModule> {
  constructor(
    private readonly key: string,
    private readonly loader: ChunkRetryLoader<TModule>,
    private readonly guard: ReloadOnceGuard
  ) {}

  public async load(): Promise<TModule> {
    try {
      const loaded = await this.loader.load();
      this.guard.reset(this.key);
      return loaded;
    } catch (error) {
      if (!chunkLoadErrorDetector.is(error) || !this.guard.allow(this.key)) throw error;
      pageReloadNavigator.reload();
      return this.pending();
    }
  }

  // The document is being replaced: leave React suspended on the fallback until it is.
  private pending(): Promise<TModule> {
    return new Promise<TModule>(() => undefined);
  }
}
