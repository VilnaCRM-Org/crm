import 'reflect-metadata';

import type { CompleteTwoFactorUserMutation } from '@/api/generated/graphql';
import type {
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';
import GraphQLSignInTransformer from '@auth/transformers/graphql-sign-in-transformer';
import type { ChallengeFailureReason } from '@auth/types/two-factor/challenge';
import { buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const NO_VIOLATIONS = { items: [], complete: true };

const failure = (
  reason: UserServiceFailureReason,
  status: number | null = null
): UserServiceFailure => ({ reason, status, violations: NO_VIOLATIONS });

const completion = (
  fields: Partial<
    NonNullable<NonNullable<CompleteTwoFactorUserMutation['completeTwoFactorUser']>['user']>
  >
): CompleteTwoFactorUserMutation => ({
  completeTwoFactorUser: {
    user: { twoFactorEnabled: true, accessToken: null, recoveryCodesRemaining: null, ...fields },
  },
});

const FAILURE_ROWS: readonly (readonly [UserServiceFailureReason, ChallengeFailureReason])[] = [
  ['invalid_code', 'invalid_code'],
  ['violation', 'invalid_code'],
  ['expired_session', 'expired_session'],
  ['unauthenticated', 'expired_session'],
  ['refused', 'expired_session'],
  ['locked', 'locked'],
  ['rate_limited', 'rate_limited'],
  ['network', 'network'],
  ['aborted', 'network'],
  ['server', 'server'],
  ['unknown', 'server'],
  ['access_denied', 'server'],
  ['invalid_password', 'server'],
  ['setup_not_initiated', 'server'],
  ['already_enabled', 'server'],
  ['not_enabled', 'server'],
  ['reauth_required', 'server'],
];

describe('GraphQLSignInTransformer.toChallengeResult', () => {
  const transformer = new GraphQLSignInTransformer();

  it.each([[0], [1], [2], [7], [null]])(
    'turns a payload with a token and recoveryCodesRemaining %p into a completed outcome',
    (remaining) => {
      const token = buildToken();

      expect(
        transformer.toChallengeResult(
          completion({ accessToken: token, recoveryCodesRemaining: remaining })
        )
      ).toEqual({ kind: 'completed', token, recoveryCodesRemaining: remaining });
    }
  );

  it('keeps a completed outcome when twoFactorEnabled is absent', () => {
    const token = buildToken();

    expect(
      transformer.toChallengeResult(completion({ twoFactorEnabled: null, accessToken: token }))
    ).toEqual({ kind: 'completed', token, recoveryCodesRemaining: null });
  });

  it.each<[string, CompleteTwoFactorUserMutation | null | undefined]>([
    ['no payload', null],
    ['an undefined payload', undefined],
    ['no completion', { completeTwoFactorUser: null }],
    ['no user', { completeTwoFactorUser: { user: null } }],
    ['no token', completion({ accessToken: null })],
    ['an empty token', completion({ accessToken: '' })],
  ])('turns %s into the server failure', (_label, payload) => {
    expect(transformer.toChallengeResult(payload)).toEqual({ kind: 'failed', reason: 'server' });
  });
});

describe('GraphQLSignInTransformer.toChallengeFailure', () => {
  const transformer = new GraphQLSignInTransformer();

  it.each(FAILURE_ROWS)('maps the %s reason to the %s outcome', (reason, expected) => {
    expect(transformer.toChallengeFailure(failure(reason, 400))).toEqual({
      kind: 'failed',
      reason: expected,
    });
  });

  it('loads the same table when the module evaluates inside the test', async () => {
    const Loaded = await loadIsolated(
      async () => (await import('@auth/transformers/graphql-sign-in-transformer')).default
    );
    const loaded = new Loaded();

    expect(FAILURE_ROWS.map(([reason]) => loaded.toChallengeFailure(failure(reason)))).toEqual(
      FAILURE_ROWS.map(([, expected]) => ({ kind: 'failed', reason: expected }))
    );
  });
});
