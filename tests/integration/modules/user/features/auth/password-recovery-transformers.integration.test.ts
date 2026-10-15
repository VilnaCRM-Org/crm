import { HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import type { GraphQLPasswordRecoveryRepository } from '@auth/repositories';
import PasswordRecoveryTransformer from '@auth/transformers/password-recovery-transformer';
import type {
  RecoveryFailedOutcome,
  RecoveryStep,
  RecoverySentOutcome,
} from '@auth/types/password-recovery/outcome';
import { buildPassword, buildResetToken } from '@tests/builders';

import { answerRecoveryOperation } from '../../../../mocks/password-recovery-operations';
import server from '../../../../mocks/server';

const repository = (): GraphQLPasswordRecoveryRepository =>
  container.resolve<GraphQLPasswordRecoveryRepository>(AUTH_TOKENS.PasswordRecoveryRepository);
const errors = (): UserServiceErrorTransformer =>
  container.resolve<UserServiceErrorTransformer>(AUTH_TOKENS.UserServiceErrorTransformer);
const outcomes = (): PasswordRecoveryTransformer =>
  container.resolve<PasswordRecoveryTransformer>(AUTH_TOKENS.PasswordRecoveryTransformer);

const graphQLErrorBody = (message: string, extensions?: Record<string, unknown>): Response =>
  HttpResponse.json({ data: null, errors: [{ message, extensions }] });

const run = async (
  step: RecoveryStep,
  controller: AbortController = new AbortController()
): Promise<RecoverySentOutcome | RecoveryFailedOutcome> => {
  const { signal } = controller;
  const email = 'eirene@gmail.com';
  try {
    if (step === 'request') {
      await repository().requestReset({ email }, signal);
    } else {
      await repository().confirmReset(
        { token: buildResetToken(), newPassword: buildPassword() },
        signal
      );
    }
    return outcomes().toSentOutcome({ email });
  } catch (caught: unknown) {
    return outcomes().fromFailure(step, errors().normalize(caught, signal));
  }
};

describe('password recovery transformers over real GraphQL answers', () => {
  afterEach(() => server.resetHandlers());

  it('resolves both transformers as singletons', () => {
    expect(errors()).toBeInstanceOf(UserServiceErrorTransformer);
    expect(errors()).toBe(errors());
    expect(outcomes()).toBeInstanceOf(PasswordRecoveryTransformer);
    expect(outcomes()).toBe(outcomes());
  });

  it('turns a resolved request into the masked sent outcome', async () => {
    const answered = answerRecoveryOperation('request', () =>
      HttpResponse.json({ data: { requestPasswordResetUser: null } })
    );

    await expect(run('request')).resolves.toEqual({
      kind: 'sent',
      maskedEmail: 'eir*****@gmail.com',
    });
    expect(answered).toHaveLength(1);
    expect(outcomes().toConfirmedOutcome()).toEqual({ kind: 'confirmed' });
  });

  it.each<[string, () => Response, RecoveryStep, RecoveryFailedOutcome['failure']]>([
    [
      'an e-mail violation',
      (): Response => graphQLErrorBody('email: This value is not valid.', { status: 422 }),
      'request',
      { reason: 'invalid_email', retryable: false },
    ],
    [
      'a newPassword violation',
      (): Response => graphQLErrorBody('newPassword: Too weak.', { status: 422 }),
      'confirm',
      { reason: 'policy_rejected', retryable: false },
    ],
    [
      'a message-only refusal on confirm',
      (): Response => graphQLErrorBody('Token has expired.'),
      'confirm',
      { reason: 'invalid_link', retryable: false },
    ],
    [
      'a message-only refusal on request',
      (): Response => graphQLErrorBody('Too many reset requests.'),
      'request',
      { reason: 'rate_limited', retryable: false },
    ],
    [
      'HTTP 429',
      (): Response => new HttpResponse(null, { status: 429 }),
      'request',
      { reason: 'rate_limited', retryable: false },
    ],
    [
      'a token violation on confirm',
      (): Response => graphQLErrorBody('token: This value is not valid.', { status: 422 }),
      'confirm',
      { reason: 'invalid_link', retryable: false },
    ],
    [
      'a 429 GraphQL error without a property',
      (): Response => graphQLErrorBody('Too many requests.', { status: 429 }),
      'request',
      { reason: 'rate_limited', retryable: false },
    ],
    [
      'HTTP 400',
      (): Response => new HttpResponse(null, { status: 400 }),
      'request',
      { reason: 'server', retryable: true },
    ],
    [
      'HTTP 503',
      (): Response => new HttpResponse(null, { status: 503 }),
      'confirm',
      { reason: 'server', retryable: true },
    ],
    [
      'a network error',
      (): Response => HttpResponse.error(),
      'request',
      { reason: 'network', retryable: true },
    ],
  ])('turns %s into its outcome', async (_name, response, step, expected) => {
    const answered = answerRecoveryOperation(step, response);

    await expect(run(step)).resolves.toEqual({ kind: 'failed', failure: expected });
    expect(answered).toHaveLength(1);
  });

  it('turns a request aborted before it is sent into a retryable network outcome', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(run('confirm', controller)).resolves.toEqual({
      kind: 'failed',
      failure: { reason: 'network', retryable: true },
    });
  });

  it.each([
    ['jo@x.io', 'j*****@x.io'],
    ['no-at-sign', '*****'],
  ])('masks %s as %s', (email, maskedEmail) => {
    expect(outcomes().toSentOutcome({ email })).toEqual({ kind: 'sent', maskedEmail });
  });

  it.each([
    ['null', null, 'unknown'],
    ['a thrown AbortError', new DOMException('aborted', 'AbortError'), 'aborted'],
    [
      'a network error with an out-of-range status',
      { networkError: { statusCode: 600 } },
      'unknown',
    ],
  ])('normalises %s to %s', (_name, error, reason) => {
    expect(errors().normalize(error).reason).toBe(reason);
  });
});
