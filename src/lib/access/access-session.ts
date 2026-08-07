import type { SessionInput, SessionLoader, SessionSnapshot } from '@/lib/types/access/session';

import accessState from './access-state';
import auditCore from './audit-core';
import sessionFactory from './session-factory';

// "Nothing has been hydrated yet" has to be distinguishable from "hydrated from the
// anonymous (null) token": reusing `null` for both would make the sync that clears a
// signed-out token a no-op, leaving the previous principal and permissions live.
const NO_SOURCE = Symbol('access-session/no-source');

export class AccessSession {
  private source: string | null | typeof NO_SOURCE = NO_SOURCE;

  private loader: SessionLoader = sessionFactory;

  // The single swap point for where a session comes from. Installing it here rather than
  // through the container keeps every hydration path — render and DI — on one loader.
  public useLoader(loader: SessionLoader): void {
    this.loader = loader;
    // Invalidate the hydrated token too: otherwise the next sync for that same token
    // short-circuits and the session stays bound to the loader that was just replaced.
    this.source = NO_SOURCE;
  }

  public load(input: SessionInput): SessionSnapshot | null {
    return this.loader.build(input);
  }

  // A snapshot the store refuses (a principal scoped to a tenant it does not belong to) is
  // treated exactly like no snapshot at all: the session stays anonymous and the token is not
  // memoized as hydrated, so a later sync retries instead of trusting a session that never was.
  public start(input: SessionInput): boolean {
    const snapshot = this.load(input);
    this.close();
    const started = snapshot !== null && accessState.setSession(snapshot.principal, snapshot.flags);
    this.source = started ? input.token : null;
    if (!started) {
      accessState.clear();
      return false;
    }
    auditCore.log({ type: 'login' });
    return true;
  }

  public sync(input: SessionInput): void {
    if (input.token === this.source) return;
    this.start(input);
  }

  public end(): void {
    this.close();
    this.source = null;
    accessState.clear();
  }

  // Every session that ends — replaced, cleared or logged out — closes with an audit event
  // while the principal is still known, so the trail reconciles into whole sessions.
  private close(): void {
    if (accessState.get().principal !== null) auditCore.log({ type: 'logout' });
  }
}

const accessSession = new AccessSession();

export default accessSession;
