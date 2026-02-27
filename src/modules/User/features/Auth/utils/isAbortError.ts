export default function isAbortError(err: unknown): boolean {
  const message = err instanceof Error ? (err.message ?? '').toLowerCase() : '';

  return (
    (err as Error)?.name === 'AbortError' ||
    (err instanceof Error && (message.includes('abort') || message.includes('cancel')))
  );
}
