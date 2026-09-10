import { inject, injectable } from 'tsyringe';

import type { SessionFactory } from '@/lib/access/session-factory';
import type { SessionInput, SessionLoader, SessionSnapshot } from '@/lib/types/access/session';

import ACCESS_TOKENS from './tokens';

@injectable()
export default class SessionRepository implements SessionLoader {
  constructor(@inject(ACCESS_TOKENS.SessionFactory) private readonly factory: SessionFactory) {}

  public build(input: SessionInput): SessionSnapshot | null {
    return this.factory.build(input);
  }
}
