import { injectable } from 'tsyringe';

import type { SocialCallbackResponse } from '@auth/types/social-sign-in/social-callback-response';
import type { SocialSignInErrorKind } from '@auth/types/social-sign-in/social-sign-in-error-kind';
import type { SocialSignInOutcome } from '@auth/types/social-sign-in/social-sign-in-outcome';
import { SocialAuthProblemSchema } from '@auth/utils/response-schemas';

// user-service `error_code` → the message the callback page shows (PRD FR12).
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

const TRANSPORT_FAILURE_STATUS = 0;

@injectable()
export default class SocialSignInTransformer {
  public toOutcome(response: SocialCallbackResponse | undefined): SocialSignInOutcome {
    if (response === undefined) return { kind: 'failed', error: 'generic' };
    if (response['2fa_enabled']) {
      return { kind: 'two-factor', pendingSessionId: response.pending_session_id };
    }
    return { kind: 'signed-in' };
  }

  public fromFailure(error: unknown, signal: AbortSignal): SocialSignInOutcome {
    if (signal.aborted) return { kind: 'aborted' };
    return { kind: 'failed', error: this.errorKindOf(error) };
  }

  // Read structurally: the HTTP client's error carries `status` (0 for a timeout or a dropped
  // connection) and the response body in `cause.body`, and a feature does not import the client.
  private errorKindOf(error: unknown): SocialSignInErrorKind {
    const { status, cause } = (error ?? {}) as { status?: unknown; cause?: unknown };
    if (typeof status !== 'number') return 'generic';
    if (status === TRANSPORT_FAILURE_STATUS) return 'unavailable';
    return ERROR_KINDS.get(this.errorCodeOf(cause) ?? '') ?? 'generic';
  }

  private errorCodeOf(cause: unknown): string | undefined {
    const body = (cause as { body?: unknown } | undefined)?.body;
    if (typeof body !== 'string') return undefined;
    try {
      const problem = SocialAuthProblemSchema.safeParse(JSON.parse(body));
      return problem.success ? problem.data.error_code : undefined;
    } catch {
      return undefined;
    }
  }
}
