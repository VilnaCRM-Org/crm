import { HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import PasswordRecoveryProvider from '@auth/data-providers/password-recovery-provider';
import { AuthProviderLoader } from '@auth/stores';
import type {
  CreateNewPasswordOutcome,
  RecoveryStep,
  ResetPasswordOutcome,
} from '@auth/types/password-recovery/outcome';
import { buildPassword, buildResetToken } from '@tests/builders';

import { answerRecoveryOperation } from '../../../../mocks/password-recovery-operations';
import server from '../../../../mocks/server';

type Outcome = ResetPasswordOutcome | CreateNewPasswordOutcome;

const EMAIL = 'eirene@gmail.com';

const errorBody = (message: string, extensions?: Record<string, unknown>): Response =>
  HttpResponse.json({ data: null, errors: [{ message, extensions }] });

const run = async (provider: PasswordRecoveryProvider, step: RecoveryStep): Promise<Outcome> => {
  const { signal } = new AbortController();
  return step === 'request'
    ? provider.requestReset({ email: EMAIL }, signal)
    : provider.confirmReset({ token: buildResetToken(), newPassword: buildPassword() }, signal);
};

const failed = (reason: string, retryable: boolean): Outcome =>
  ({ kind: 'failed', failure: { reason, retryable } }) as Outcome;

describe('PasswordRecoveryProvider over the container and msw', () => {
  let provider: PasswordRecoveryProvider;

  beforeEach(async () => {
    provider = await new AuthProviderLoader().resolve<PasswordRecoveryProvider>(
      AUTH_TOKENS.PasswordRecoveryProvider
    );
  });

  afterEach(() => server.resetHandlers());

  it('resolves the container singleton through two loaders', async () => {
    const other = await new AuthProviderLoader().resolve<PasswordRecoveryProvider>(
      AUTH_TOKENS.PasswordRecoveryProvider
    );

    expect(provider).toBeInstanceOf(PasswordRecoveryProvider);
    expect(other).toBe(provider);
    expect(container.resolve(AUTH_TOKENS.PasswordRecoveryProvider)).toBe(provider);
  });

  it.each<[string, () => Response, RecoveryStep, Outcome]>([
    [
      'a resolved request payload',
      (): Response =>
        HttpResponse.json({ data: { requestPasswordResetUser: { clientMutationId: 'id' } } }),
      'request',
      { kind: 'sent', maskedEmail: 'eir*****@gmail.com' },
    ],
    [
      'a null request payload',
      (): Response => HttpResponse.json({ data: { requestPasswordResetUser: null } }),
      'request',
      { kind: 'sent', maskedEmail: 'eir*****@gmail.com' },
    ],
    [
      'a resolved confirm payload',
      (): Response => HttpResponse.json({ data: { confirmPasswordResetUser: null } }),
      'confirm',
      { kind: 'confirmed' },
    ],
    [
      'an email violation',
      (): Response => errorBody('email: This value is not valid.', { status: 422 }),
      'request',
      failed('invalid_email', false),
    ],
    [
      'a newPassword violation',
      (): Response => errorBody('newPassword: Too weak.', { status: 422 }),
      'confirm',
      failed('policy_rejected', false),
    ],
    [
      'a token violation',
      (): Response => errorBody('token: This value is not valid.', { status: 422 }),
      'confirm',
      failed('invalid_link', false),
    ],
    [
      'a message-only request error',
      (): Response => errorBody('Too many requests for this address.'),
      'request',
      failed('rate_limited', false),
    ],
    [
      'a message-only confirm error',
      (): Response => errorBody('Token has expired.'),
      'confirm',
      failed('invalid_link', false),
    ],
    [
      'HTTP 429',
      (): Response => new HttpResponse(null, { status: 429 }),
      'request',
      failed('rate_limited', false),
    ],
    [
      'HTTP 503',
      (): Response => new HttpResponse(null, { status: 503 }),
      'confirm',
      failed('server', true),
    ],
    ['a network error', (): Response => HttpResponse.error(), 'request', failed('network', true)],
  ])('answers %s with its outcome and one request', async (_name, response, step, expected) => {
    const answered = answerRecoveryOperation(step, response);

    await expect(run(provider, step)).resolves.toEqual(expected);
    expect(answered).toHaveLength(1);
  });
});

describe('AuthProviderLoader load failure', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('captures the failure, forgets it and loads the container on the next call', async () => {
    const failure = new Error('container failed');
    let attempts = 0;
    jest.doMock('@/config/dependency-injection-config', () => {
      attempts += 1;
      if (attempts === 1) throw failure;
      return jest.requireActual('@/config/dependency-injection-config');
    });
    const observability = (await import('@/services/observability/observability-core')).default;
    const capture = jest.spyOn(observability, 'captureError').mockImplementation(() => undefined);
    const { AuthProviderLoader: Loader } = await import('@auth/stores');
    const loader = new Loader();

    await expect(loader.resolve(AUTH_TOKENS.PasswordRecoveryProvider)).rejects.toBe(failure);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(failure, { source: 'auth:provider-load' });

    await expect(loader.resolve(AUTH_TOKENS.PasswordRecoveryProvider)).resolves.toBeDefined();
    expect(attempts).toBe(2);
  });

  it('captures an unregistered token under provider-resolve, not provider-load', async () => {
    const observability = (await import('@/services/observability/observability-core')).default;
    const capture = jest.spyOn(observability, 'captureError').mockImplementation(() => undefined);
    const { AuthProviderLoader: Loader } = await import('@auth/stores');
    const loader = new Loader();
    const unregistered = Symbol('UnregisteredProvider');

    const caught = await loader.resolve(unregistered).catch((error: unknown) => error);

    expect(caught).toBeInstanceOf(Error);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(caught, { source: 'auth:provider-resolve' });
  });
});
