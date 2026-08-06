import type { SessionInput, SessionSnapshot } from '@/lib/types/access/session';

import accessState from './access-state';
import auditCore from './audit-core';
import sessionFactory from './session-factory';

export class AccessSession {
  private source: string | null = null;

  public start(input: SessionInput): boolean {
    return this.apply(input, sessionFactory.build(input));
  }

  public sync(input: SessionInput): void {
    if (input.token === this.source) return;
    this.start(input);
  }

  public apply(input: SessionInput, snapshot: SessionSnapshot | null): boolean {
    this.source = snapshot === null ? null : input.token;
    if (snapshot === null) {
      accessState.clear();
      return false;
    }
    accessState.setSession(snapshot.principal, snapshot.flags);
    auditCore.log({ type: 'login' });
    return true;
  }

  public end(): void {
    if (accessState.get().principal !== null) auditCore.log({ type: 'logout' });
    this.source = null;
    accessState.clear();
  }
}

const accessSession = new AccessSession();

export default accessSession;
