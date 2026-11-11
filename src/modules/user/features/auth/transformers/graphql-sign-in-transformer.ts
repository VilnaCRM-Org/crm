import { injectable } from 'tsyringe';

import type { CompleteTwoFactorUserMutation, SignInUserMutation } from '@/api/generated/graphql';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type {
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';
import type { AuthError } from '@auth/types/auth-error';
import type {
  ChallengeFailedOutcome,
  ChallengeFailureReason,
  ChallengeResult,
} from '@auth/types/two-factor/challenge';
import type { SignInResult } from '@auth/types/two-factor/sign-in';

const ABORTED_ERROR: AuthError = {
  kind: 'network',
  displayMessage: '',
  retryable: false,
  aborted: true,
};

const INVALID_CREDENTIALS: AuthError = {
  kind: 'authentication',
  displayMessage: 'sign_in.errors.invalid_credentials',
  retryable: false,
  reason: 'invalid_credentials',
};

const LOCKED: AuthError = {
  kind: 'authentication',
  displayMessage: 'sign_in.errors.locked',
  retryable: false,
  status: 423,
  reason: 'locked',
};

const RATE_LIMITED: AuthError = {
  kind: 'server',
  displayMessage: 'sign_in.errors.rate_limited',
  retryable: false,
  status: 429,
  reason: 'rate_limited',
};

const TRANSIENT_NETWORK: AuthError = {
  kind: 'network',
  displayMessage: 'sign_in.errors.transient',
  retryable: true,
  reason: 'transient',
};

const TRANSIENT_SERVER: AuthError = { ...TRANSIENT_NETWORK, kind: 'server' };

const FAILURES = new Map<UserServiceFailureReason, AuthError>([
  ['violation', INVALID_CREDENTIALS],
  ['unauthenticated', INVALID_CREDENTIALS],
  ['refused', INVALID_CREDENTIALS],
  ['locked', LOCKED],
  ['rate_limited', RATE_LIMITED],
  ['network', TRANSIENT_NETWORK],
  ['aborted', ABORTED_ERROR],
]);

const STATUS_FAILURES = new Map<number | null, AuthError>([
  [401, INVALID_CREDENTIALS],
  [422, INVALID_CREDENTIALS],
  [423, LOCKED],
  [429, RATE_LIMITED],
]);

const CHALLENGE_FAILURES = new Map<UserServiceFailureReason, ChallengeFailureReason>([
  ['invalid_code', 'invalid_code'],
  ['violation', 'invalid_code'],
  ['expired_session', 'expired_session'],
  ['unauthenticated', 'expired_session'],
  ['refused', 'expired_session'],
  ['locked', 'locked'],
  ['rate_limited', 'rate_limited'],
  ['network', 'network'],
  ['aborted', 'network'],
]);

const SERVER_CHALLENGE_FAILURE: ChallengeFailedOutcome = { kind: 'failed', reason: 'server' };

@injectable()
export default class GraphQLSignInTransformer {
  public toSignInResult(
    payload: SignInUserMutation | null | undefined,
    dto: SignInDto
  ): SignInResult {
    const data = payload?.signInUser?.user;
    const email = dto.email.toLowerCase();
    if (data?.twoFactorEnabled === true && data.pendingSessionId) {
      return {
        ok: true,
        value: { kind: 'challenge', email, pendingSessionId: data.pendingSessionId },
      };
    }
    if (data?.twoFactorEnabled === false && data.accessToken) {
      return { ok: true, value: { kind: 'session', email, token: data.accessToken } };
    }
    return { ok: false, error: TRANSIENT_SERVER };
  }

  public toSignInFailure(failure: UserServiceFailure): SignInResult {
    const error =
      STATUS_FAILURES.get(failure.status) ?? FAILURES.get(failure.reason) ?? TRANSIENT_SERVER;
    return { ok: false, error };
  }

  public toChallengeResult(
    payload: CompleteTwoFactorUserMutation | null | undefined
  ): ChallengeResult {
    const data = payload?.completeTwoFactorUser?.user;
    if (!data?.accessToken) return SERVER_CHALLENGE_FAILURE;
    return {
      kind: 'completed',
      token: data.accessToken,
      recoveryCodesRemaining: data.recoveryCodesRemaining ?? null,
    };
  }

  public toChallengeFailure(failure: UserServiceFailure): ChallengeFailedOutcome {
    const reason =
      failure.status === 401 && failure.reason !== 'invalid_code'
        ? 'expired_session'
        : CHALLENGE_FAILURES.get(failure.reason);
    return reason === undefined ? SERVER_CHALLENGE_FAILURE : { kind: 'failed', reason };
  }
}
