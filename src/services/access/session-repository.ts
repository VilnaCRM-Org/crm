import { injectable } from 'tsyringe';

import sessionFactory from '@/lib/access/session-factory';
import type { SessionInput, SessionLoader, SessionSnapshot } from '@/lib/types/access/session';

@injectable()
export default class SessionRepository implements SessionLoader {
  public build(input: SessionInput): SessionSnapshot | null {
    return sessionFactory.build(input);
  }

  public load(input: SessionInput): SessionSnapshot | null {
    return this.build(input);
  }
}
