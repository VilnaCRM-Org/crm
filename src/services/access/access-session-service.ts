import { inject, injectable } from 'tsyringe';

import accessSession from '@/lib/access/access-session';
import type { SessionInput } from '@/lib/types/access/session';

import type SessionRepository from './session-repository';
import ACCESS_TOKENS from './tokens';

@injectable()
export default class AccessSessionService {
  constructor(
    @inject(ACCESS_TOKENS.SessionRepository) private readonly sessions: SessionRepository
  ) {}

  public start(input: SessionInput): boolean {
    return accessSession.apply(input, this.sessions.load(input));
  }

  public end(): void {
    accessSession.end();
  }
}
