import type { SessionInput, SessionLoader, SessionSnapshot } from '@/lib/types/access/session';

import accessState from './access-state';
import auditCore from './audit-core';
import sessionFactory from './session-factory';

export class AccessSession {
  private source: string | null = null;

  private loader: SessionLoader = sessionFactory;

  // The single swap point for where a session comes from. Installing it here rather than
  // through the container keeps every hydration path — render and DI — on one loader.
  public useLoader(loader: SessionLoader): void {
    this.loader = loader;
    // Forget the hydrated token too: otherwise the next sync for that same token
    // short-circuits and the session stays bound to the loader that was just replaced.
    this.source = null;
  }

  public load(input: SessionInput): SessionSnapshot | null {
    return this.loader.build(input);
  }

  public start(input: SessionInput): boolean {
    const snapshot = this.load(input);
    this.close();
    this.source = snapshot === null ? null : input.token;
    if (snapshot === null) {
      accessState.clear();
      return false;
    }
    accessState.setSession(snapshot.principal, snapshot.flags);
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
