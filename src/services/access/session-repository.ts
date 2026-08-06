import { injectable } from 'tsyringe';

import sessionFactory from '@/lib/access/session-factory';
import type { SessionInput, SessionSnapshot } from '@/lib/types/access/session';

@injectable()
export default class SessionRepository {
  public load(input: SessionInput): SessionSnapshot | null {
    return sessionFactory.build(input);
  }
}
