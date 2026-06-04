import { injectable } from 'tsyringe';

@injectable()
export default class AbortErrorDetector {
  public isAbortError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    const message = (err.message ?? '').toLowerCase();
    const code = (err as { code?: unknown }).code;
    return (
      err.name === 'AbortError' ||
      code === 'ABORT_ERR' ||
      message.includes('abort') ||
      message.includes('cancel')
    );
  }
}
