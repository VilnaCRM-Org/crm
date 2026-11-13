import { HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import type { UserServiceFailure } from '@/modules/user/types/user-service/user-service-failure';
import type { GraphQLPasswordRecoveryRepository } from '@auth/repositories';
import { buildPassword, buildResetToken } from '@tests/builders';

import { answerRecoveryOperation } from '../../../../mocks/password-recovery-operations';
import server from '../../../../mocks/server';

const repository = (): GraphQLPasswordRecoveryRepository =>
  container.resolve<GraphQLPasswordRecoveryRepository>(AUTH_TOKENS.PasswordRecoveryRepository);
const errors = (): UserServiceErrorTransformer =>
  container.resolve<UserServiceErrorTransformer>(AUTH_TOKENS.UserServiceErrorTransformer);

const graphQLErrorBody = (message: string, extensions?: Record<string, unknown>): Response =>
  HttpResponse.json({ data: null, errors: [{ message, extensions }] });

const normalized = async (response: () => Response): Promise<UserServiceFailure> => {
  answerRecoveryOperation('confirm', response);
  const caught = await repository()
    .confirmReset(
      { token: buildResetToken(), newPassword: buildPassword() },
      new AbortController().signal
    )
    .then(
      () => null,
      (error: unknown) => error
    );
  return errors().normalize(caught);
};

const failureOf = (
  reason: UserServiceFailure['reason'],
  status: number | null,
  items: UserServiceFailure['violations']['items'] = []
): UserServiceFailure => ({ reason, status, violations: { items, complete: true } });

describe('the two-factor rows of the container-resolved UserServiceErrorTransformer', () => {
  afterEach(() => server.resetHandlers());

  it.each<[string, () => Response, UserServiceFailure]>([
    [
      'a transport 423',
      (): Response => new HttpResponse(null, { status: 423 }),
      failureOf('locked', 423),
    ],
    [
      'a GraphQL extensions.status 423',
      (): Response => graphQLErrorBody('Account temporarily locked', { status: 423 }),
      failureOf('locked', 423),
    ],
    [
      'the wrong-code text',
      (): Response => graphQLErrorBody('Invalid two-factor code.', { status: 401 }),
      failureOf('invalid_code', 401),
    ],
    [
      'the expired-session text',
      (): Response => graphQLErrorBody('Invalid or expired two-factor session.', { status: 401 }),
      failureOf('expired_session', 401),
    ],
    [
      'the setup-not-initiated text',
      (): Response => graphQLErrorBody('Two-factor setup not initiated.', { status: 401 }),
      failureOf('setup_not_initiated', 401),
    ],
    [
      'the already-enabled text',
      (): Response =>
        graphQLErrorBody('Two-factor authentication is already enabled.', { status: 409 }),
      failureOf('already_enabled', 409),
    ],
    [
      'the not-enabled text without a status',
      (): Response => graphQLErrorBody('Two-factor authentication is not enabled.'),
      failureOf('not_enabled', null),
    ],
    [
      'the re-authentication text',
      (): Response => graphQLErrorBody('Re-authentication required.', { status: 403 }),
      failureOf('reauth_required', 403),
    ],
    [
      'a twoFactorCode violation',
      (): Response => graphQLErrorBody('twoFactorCode: This value is not valid.', { status: 422 }),
      failureOf('violation', 422, [{ path: 'twoFactorCode', reason: 'other' }]),
    ],
    [
      'a near-miss of the wrong-code text',
      (): Response => graphQLErrorBody('Invalid two-factor code. Retry'),
      failureOf('refused', null),
    ],
  ])('normalises %s', async (_name, response, expected) => {
    await expect(normalized(response)).resolves.toEqual(expected);
  });
});
