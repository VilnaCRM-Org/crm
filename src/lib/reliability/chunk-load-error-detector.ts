const CHUNK_LOAD_MESSAGES: readonly string[] = [
  'loading chunk',
  'loading css chunk',
  'dynamically imported module',
];

export class ChunkLoadErrorDetector {
  public is(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const { name, message } = error as { name?: unknown; message?: unknown };
    if (name === 'ChunkLoadError') return true;

    return typeof message === 'string' && this.mentionsChunk(message.toLowerCase());
  }

  private mentionsChunk(message: string): boolean {
    return CHUNK_LOAD_MESSAGES.some((fragment) => message.includes(fragment));
  }
}

const chunkLoadErrorDetector = new ChunkLoadErrorDetector();

export default chunkLoadErrorDetector;
