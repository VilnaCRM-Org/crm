import chunkLoadErrorDetector from './chunk-load-error-detector';

// Memoizes one dynamic import() so every consumer shares the in-flight promise, forgets a failed
// one so the next call can try again, and absorbs exactly one chunk-load failure itself: a
// missing or half-fetched chunk is usually a stale deploy or a dropped connection, and a second
// request a moment later is the cheapest recovery. Any other error, and a second chunk failure,
// reach the caller untouched (issue #147).
export default class ChunkRetryLoader<TModule> {
  private promise: Promise<TModule> | null = null;

  constructor(private readonly importModule: () => Promise<TModule>) {}

  public load(): Promise<TModule> {
    this.promise ??= this.loadWithRetry().catch((error: unknown) => {
      this.promise = null;
      throw error;
    });

    return this.promise;
  }

  private loadWithRetry(): Promise<TModule> {
    return this.importModule().catch((error: unknown) => {
      if (!chunkLoadErrorDetector.is(error)) throw error;
      return this.importModule();
    });
  }
}
