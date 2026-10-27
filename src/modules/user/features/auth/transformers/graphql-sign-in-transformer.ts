import { injectable } from 'tsyringe';

import type { SignInUserMutation } from '@/api/generated/graphql';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type {
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';
import type { AuthError } from '@auth/types/auth-error';
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
    return { ok: false, error: FAILURES.get(failure.reason) ?? TRANSIENT_SERVER };
  }
}
