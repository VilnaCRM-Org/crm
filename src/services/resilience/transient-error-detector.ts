import { injectable } from 'tsyringe';

// Status 0 is the transport itself (network failure or the request deadline); 408 and the 5xx
// gateway family are the server saying "not right now". A 429 is a cooldown, not a transient
// fault, and a caller abort is a decision — neither is retried.
const TRANSIENT_STATUSES: ReadonlySet<number> = new Set([0, 408, 500, 502, 503, 504]);

@injectable()
export default class TransientErrorDetector {
  public is(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const { name, status } = error as { name?: unknown; status?: unknown };
    if (name === 'AbortError') return false;

    return typeof status === 'number' && TRANSIENT_STATUSES.has(status);
  }
}
