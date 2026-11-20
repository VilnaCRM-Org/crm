import type { ApolloError } from '@apollo/client';
import { injectable } from 'tsyringe';

import type { AuthFailureReason } from '@/services/types/security-events/security-event';
import type { SocialFailureSignal } from '@auth/types/social-sign-in/social-failure-signal';
import type { SocialSignInErrorKind } from '@auth/types/social-sign-in/social-sign-in-error-kind';
import type {
  SocialFailureOutcome,
  SocialSignInOutcome,
  SocialStartOutcome,
} from '@auth/types/social-sign-in/social-sign-in-outcome';
import type {
  SocialCompletion,
  SocialInitiation,
} from '@auth/types/social-sign-in/social-sign-in-result';

// user-service `extensions.error_code` → the message the callback page shows (PRD FR12).
const ERROR_KINDS = new Map<string, SocialSignInErrorKind>([
  ['missing_oauth_parameters', 'missing_parameters'],
  ['provider_mismatch', 'provider_mismatch'],
  ['unsupported_provider', 'unsupported_provider'],
  ['duplicate_email', 'duplicate_email'],
  ['invalid_state', 'expired'],
  ['state_expired', 'expired'],
  ['provider_email_unavailable', 'email_unavailable'],
  ['unverified_provider_email', 'email_unverified'],
  ['provider_unavailable', 'unavailable'],
]);

const STATUS_REASONS = new Map<number, AuthFailureReason>([
  [401, 'authentication'],
  [403, 'authentication'],
  [409, 'conflict'],
]);
const SERVER_ERROR = 500;

@injectable()
export default class SocialSignInTransformer {
  public toStart(initiation: SocialInitiation): SocialStartOutcome {
    return { kind: 'redirect', ...initiation };
  }

  public toOutcome(completion: SocialCompletion): SocialSignInOutcome {
    return completion.twoFactorEnabled === true
      ? { kind: 'two-factor', pendingSessionId: completion.pendingSessionId }
      : { kind: 'signed-in' };
  }

  public fromFailure(error: unknown, signal: AbortSignal): SocialFailureOutcome {
    if (signal.aborted) return { kind: 'aborted' };
    return { kind: 'failed', error: this.errorKindOf(error) };
  }

  public signalOf(error: unknown): SocialFailureSignal {
    const { networkError, graphQLErrors } = Object(error) as Partial<ApolloError>;
    const answered = graphQLErrors?.[0]?.extensions?.status;
    const status = typeof answered === 'number' ? answered : undefined;
    return { kind: networkError ? 'network' : this.reasonOf(status), status };
  }

  private reasonOf(status: number | undefined): AuthFailureReason {
    if (status === undefined) return 'unknown';
    return status >= SERVER_ERROR ? 'server' : (STATUS_REASONS.get(status) ?? 'validation');
  }

  // A transport failure (no answer at all) is "unavailable"; a GraphQL error names its reason in
  // `extensions.error_code`, and anything unmapped, including an unparsable body, is "generic".
  private errorKindOf(error: unknown): SocialSignInErrorKind {
    const { networkError, graphQLErrors } = Object(error) as Partial<ApolloError>;
    if (networkError) return 'unavailable';
    const code = graphQLErrors?.[0]?.extensions?.error_code;
    return (typeof code === 'string' ? ERROR_KINDS.get(code) : undefined) ?? 'generic';
  }
}
