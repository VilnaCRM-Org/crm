import UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';
import type { ProtectedSession } from '@/routes/types/protected-outlet-context';
import correlationIdProvider from '@/services/observability/correlation-id-provider';
import observabilityCore from '@/services/observability/observability-core';

import type {
  CurrentUserAttempt,
  CurrentUserFailedOutcome,
  CurrentUserParse,
  CurrentUserReadOutcome,
} from '../types/current-user/current-user-read';

import CurrentUserClient from './current-user-client';
import CurrentUserResponseParser from './current-user-response-parser';

const SESSION_ENDED: CurrentUserFailedOutcome = { kind: 'failed', reason: 'session_ended' };

const UNAVAILABLE: CurrentUserFailedOutcome = { kind: 'failed', reason: 'unavailable' };

class CurrentUserSource {
  private readonly client = new CurrentUserClient();

  private readonly parser = new CurrentUserResponseParser();

  private readonly displayNames = new UserDisplayNameMapper();

  public async read(
    session: ProtectedSession,
    signal: AbortSignal
  ): Promise<CurrentUserReadOutcome> {
    const token = session.token();
    if (token === null) return SESSION_ENDED;
    const attempt = { session, token, signal, requestId: correlationIdProvider.next() };
    try {
      return this.settle(this.parser.parse(await this.client.send(attempt)), attempt);
    } catch (error) {
      return this.failed(error, attempt);
    }
  }

  private settle(parsed: CurrentUserParse, attempt: CurrentUserAttempt): CurrentUserReadOutcome {
    if (parsed.kind === 'ok') {
      return { kind: 'ok', identity: this.displayNames.fromFullName(parsed.fullName) };
    }
    if (attempt.signal.aborted) return UNAVAILABLE;
    this.capture(parsed.error, attempt.requestId);
    if (parsed.reason === 'unauthorized') attempt.session.end(attempt.token);

    return parsed.reason === 'unavailable' ? UNAVAILABLE : SESSION_ENDED;
  }

  private failed(error: unknown, attempt: CurrentUserAttempt): CurrentUserReadOutcome {
    if (!attempt.signal.aborted) this.capture(error, attempt.requestId);

    return UNAVAILABLE;
  }

  private capture(error: unknown, requestId: string): void {
    observabilityCore.captureError(error, {
      source: 'settings:current-user',
      [correlationIdProvider.header]: requestId,
    });
  }
}

const currentUserSource = new CurrentUserSource();

export default currentUserSource;
