const RSPACK_CHUNK_PREFIXES: readonly string[] = ['loading chunk ', 'loading css chunk '];

const DYNAMIC_IMPORT_FAILURES: readonly string[] = [
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
];

export class ChunkLoadErrorDetector {
  public is(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const { name, message } = error as { name?: unknown; message?: unknown };
    if (name === 'ChunkLoadError') return true;

    return typeof message === 'string' && this.describesChunkFailure(message.toLowerCase());
  }

  private describesChunkFailure(message: string): boolean {
    return (
      RSPACK_CHUNK_PREFIXES.some((prefix) => message.startsWith(prefix)) ||
      DYNAMIC_IMPORT_FAILURES.some((failure) => message.includes(failure))
    );
  }
}

const chunkLoadErrorDetector = new ChunkLoadErrorDetector();

export default chunkLoadErrorDetector;
