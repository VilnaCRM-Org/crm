import type { ApolloError } from '@apollo/client';
import { injectable } from 'tsyringe';

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

  // A transport failure (no answer at all) is "unavailable"; a GraphQL error names its reason in
  // `extensions.error_code`, and anything unmapped, including an unparsable body, is "generic".
  private errorKindOf(error: unknown): SocialSignInErrorKind {
    const { networkError, graphQLErrors } = Object(error) as Partial<ApolloError>;
    if (networkError) return 'unavailable';
    const code = graphQLErrors?.[0]?.extensions?.error_code;
    return (typeof code === 'string' ? ERROR_KINDS.get(code) : undefined) ?? 'generic';
  }
}
