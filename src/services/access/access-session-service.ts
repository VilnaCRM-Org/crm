import { inject, injectable } from 'tsyringe';

import type { AccessSession } from '@/lib/access/access-session';
import type { SessionInput } from '@/lib/types/access/session';

import type SessionRepository from './session-repository';
import ACCESS_TOKENS from './tokens';

@injectable()
export default class AccessSessionService {
  // Installing the injected repository as the session loader makes the DI-registered source
  // the one every hydration path uses — the render path included — so replacing the binding
  // really does replace where a session comes from.
  constructor(
    @inject(ACCESS_TOKENS.AccessSession) private readonly session: AccessSession,
    @inject(ACCESS_TOKENS.SessionRepository) repository: SessionRepository
  ) {
    this.session.useLoader(repository);
  }

  public start(input: SessionInput): boolean {
    return this.session.start(input);
  }

  public end(): void {
    this.session.end();
  }
}
