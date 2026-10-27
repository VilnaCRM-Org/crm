import 'reflect-metadata';

import type { SignInUserMutation } from '@/api/generated/graphql';
import type {
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';
import GraphQLSignInTransformer from '@auth/transformers/graphql-sign-in-transformer';
import { buildEmail, buildPassword, buildPendingSessionId, buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const NO_VIOLATIONS = { items: [], complete: true };

const failure = (
  reason: UserServiceFailureReason,
  status: number | null = null
): UserServiceFailure => ({
  reason,
  status,
  violations: NO_VIOLATIONS,
});

const user = (
  fields: Partial<NonNullable<NonNullable<SignInUserMutation['signInUser']>['user']>>
): SignInUserMutation => ({
  signInUser: {
    user: {
      success: true,
      twoFactorEnabled: null,
      accessToken: null,
      pendingSessionId: null,
      ...fields,
    },
  },
});

const loadTransformer = async (): Promise<GraphQLSignInTransformer> => {
  const Transformer = await loadIsolated(
    async () => (await import('@auth/transformers/graphql-sign-in-transformer')).default
  );
  return new Transformer();
};

const INVALID_CREDENTIALS = {
  ok: false,
  error: {
    kind: 'authentication',
    displayMessage: 'sign_in.errors.invalid_credentials',
    retryable: false,
    reason: 'invalid_credentials',
  },
};

describe('GraphQLSignInTransformer.toSignInResult', () => {
  const transformer = new GraphQLSignInTransformer();
  const dto = { email: buildEmail().toUpperCase(), password: buildPassword() };

  it('turns a 2FA-off payload with a token into a session with a lower-cased e-mail', () => {
    const token = buildToken();

    const result = transformer.toSignInResult(
      user({ twoFactorEnabled: false, accessToken: token }),
      dto
    );

    expect(result).toEqual({
      ok: true,
      value: { kind: 'session', email: dto.email.toLowerCase(), token },
    });
  });

  it('turns a 2FA-on payload with a pending session into a challenge', () => {
    const pendingSessionId = buildPendingSessionId();

    const result = transformer.toSignInResult(
      user({ twoFactorEnabled: true, pendingSessionId }),
      dto
    );

    expect(result).toEqual({
      ok: true,
      value: { kind: 'challenge', email: dto.email.toLowerCase(), pendingSessionId },
    });
  });

  it.each<[string, SignInUserMutation | null | undefined]>([
    ['null data', null],
    ['undefined data', undefined],
    ['a null signInUser', { signInUser: null }],
    ['a null user', { signInUser: { user: null } }],
    ['2FA off without a token', user({ twoFactorEnabled: false })],
    ['2FA off with an empty token', user({ twoFactorEnabled: false, accessToken: '' })],
    ['an unknown flag with a token', user({ accessToken: buildToken() })],
    ['2FA on without a pending session', user({ twoFactorEnabled: true })],
    [
      '2FA on with an empty pending session',
      user({ twoFactorEnabled: true, pendingSessionId: '' }),
    ],
    [
      '2FA on with a token and no pending session',
      user({ twoFactorEnabled: true, accessToken: buildToken() }),
    ],
  ])('turns %s into the transient server failure', (_name, payload) => {
    expect(transformer.toSignInResult(payload, dto)).toEqual({
      ok: false,
      error: {
        kind: 'server',
        displayMessage: 'sign_in.errors.transient',
        retryable: true,
        reason: 'transient',
      },
    });
  });

  it('prefers the pending session when 2FA is on, even with a token present', () => {
    const pendingSessionId = buildPendingSessionId();

    const result = transformer.toSignInResult(
      user({ twoFactorEnabled: true, pendingSessionId, accessToken: buildToken() }),
      dto
    );

    expect(result).toMatchObject({ ok: true, value: { kind: 'challenge', pendingSessionId } });
  });
});

describe('GraphQLSignInTransformer.toSignInFailure', () => {
  const transformer = new GraphQLSignInTransformer();

  it.each<UserServiceFailureReason>(['violation', 'unauthenticated', 'refused'])(
    'gives %s the one identical invalid_credentials failure, whatever its status',
    (reason) => {
      expect(transformer.toSignInFailure(failure(reason))).toEqual(INVALID_CREDENTIALS);
      expect(transformer.toSignInFailure(failure(reason, 401))).toEqual(INVALID_CREDENTIALS);
      expect(transformer.toSignInFailure(failure(reason, 422))).toEqual(INVALID_CREDENTIALS);
      expect(transformer.toSignInFailure(failure(reason, 400))).toEqual(INVALID_CREDENTIALS);
    }
  );

  it('maps locked to an authentication failure with status 423 and no retry', () => {
    expect(transformer.toSignInFailure(failure('locked', 423))).toEqual({
      ok: false,
      error: {
        kind: 'authentication',
        displayMessage: 'sign_in.errors.locked',
        retryable: false,
        status: 423,
        reason: 'locked',
      },
    });
  });

  it('maps rate_limited to a server failure with status 429 and no retry', () => {
    expect(transformer.toSignInFailure(failure('rate_limited', 429))).toEqual({
      ok: false,
      error: {
        kind: 'server',
        displayMessage: 'sign_in.errors.rate_limited',
        retryable: false,
        status: 429,
        reason: 'rate_limited',
      },
    });
  });

  it('maps network to a retryable network failure', () => {
    expect(transformer.toSignInFailure(failure('network'))).toEqual({
      ok: false,
      error: {
        kind: 'network',
        displayMessage: 'sign_in.errors.transient',
        retryable: true,
        reason: 'transient',
      },
    });
  });

  it.each<UserServiceFailureReason>([
    'server',
    'unknown',
    'access_denied',
    'invalid_password',
    'invalid_code',
    'expired_session',
    'setup_not_initiated',
    'already_enabled',
    'not_enabled',
    'reauth_required',
  ])('maps %s to a retryable server failure', (reason) => {
    expect(transformer.toSignInFailure(failure(reason, 503))).toEqual({
      ok: false,
      error: {
        kind: 'server',
        displayMessage: 'sign_in.errors.transient',
        retryable: true,
        reason: 'transient',
      },
    });
  });

  it('maps aborted to the existing aborted AuthError', () => {
    expect(transformer.toSignInFailure(failure('aborted'))).toEqual({
      ok: false,
      error: { kind: 'network', displayMessage: '', retryable: false, aborted: true },
    });
  });

  it('keeps every invalid_credentials cause field-for-field identical (NFR-3)', () => {
    const results = (['violation', 'unauthenticated', 'refused'] as const).map((reason) =>
      JSON.stringify(transformer.toSignInFailure(failure(reason)))
    );

    expect(new Set(results).size).toBe(1);
  });

  it('holds its tables as module-level data and needs no collaborator', async () => {
    const loaded = await loadTransformer();

    expect(loaded.toSignInFailure(failure('locked', 423))).toMatchObject({
      error: { reason: 'locked' },
    });
    expect(GraphQLSignInTransformer.length).toBe(0);
  });
});
