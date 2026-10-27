import { HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import { TwoFactorSettingsProvider } from '@/modules/user/features/settings/data-providers';
import type {
  TwoFactorSettingsFailureReason,
  TwoFactorSettingsOutcome,
} from '@/modules/user/features/settings/types/two-factor/outcome';
import DeadlineFetchAdapter from '@/services/https-client/deadline-fetch-adapter';
import { HttpError } from '@/services/https-client/http-error';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import {
  buildOtpauthUri,
  buildRecoveryCodeSet,
  buildToken,
  buildTotpCode,
  buildTotpSecret,
} from '@tests/builders';

import server from '../../../../mocks/server';
import {
  answerTwoFactorSettings,
  type TwoFactorSettingsOperationName,
} from '../../../../mocks/two-factor-settings-operations';

const provider = container.resolve<TwoFactorSettingsProvider>(
  AUTH_TOKENS.TwoFactorSettingsProvider
);

const { signal } = new AbortController();
const dto = { twoFactorCode: buildTotpCode() };

const run = (
  operation: TwoFactorSettingsOperationName,
  caller: AbortSignal = signal
): Promise<TwoFactorSettingsOutcome> => {
  if (operation === 'SetupTwoFactorUser') return provider.setup(caller);
  if (operation === 'ConfirmTwoFactorUser') return provider.confirm(dto, caller);
  if (operation === 'DisableTwoFactorUser') return provider.disable(dto, caller);
  return provider.regenerate(caller);
};

const OPERATIONS: readonly TwoFactorSettingsOperationName[] = [
  'SetupTwoFactorUser',
  'ConfirmTwoFactorUser',
  'DisableTwoFactorUser',
  'RegenerateRecoveryCodesUser',
];

const problem = (status: number): Response =>
  new HttpResponse(
    JSON.stringify({
      type: 'about:blank',
      title: status === 401 ? 'Unauthorized' : 'Error',
      status,
      detail: 'Authentication required.',
    }),
    {
      status,
      headers: { 'Content-Type': 'application/problem+json', 'WWW-Authenticate': 'Bearer' },
    }
  );

const graphQLError = (error: object): Response =>
  HttpResponse.json({ data: null, errors: [error] });

const failed = (reason: TwoFactorSettingsFailureReason): object => ({ kind: 'failed', reason });

describe('TwoFactorSettingsProvider over the container client (integration)', () => {
  const token = buildToken();

  beforeEach(() => {
    useAuthStore.setState({ ...CLEARED_AUTH_STATE, token });
  });

  afterEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    useAuthStore.setState(CLEARED_AUTH_STATE);
  });

  it('resolves one singleton of the provider class', () => {
    expect(container.resolve(AUTH_TOKENS.TwoFactorSettingsProvider)).toBe(provider);
    expect(provider).toBeInstanceOf(TwoFactorSettingsProvider);
  });

  it('answers setup, confirm, disable and regenerate with the changed entity', async () => {
    const otpauthUri = buildOtpauthUri();
    const secret = buildTotpSecret();
    const set = buildRecoveryCodeSet();
    const codes = set.items.map((code) => code.value);
    answerTwoFactorSettings('SetupTwoFactorUser', () =>
      HttpResponse.json({ data: { setupTwoFactorUser: { user: { otpauthUri, secret } } } })
    );
    answerTwoFactorSettings('ConfirmTwoFactorUser', () =>
      HttpResponse.json({ data: { confirmTwoFactorUser: { user: { recoveryCodes: codes } } } })
    );
    answerTwoFactorSettings('DisableTwoFactorUser', () =>
      HttpResponse.json({ data: { disableTwoFactorUser: { user: { success: true } } } })
    );
    answerTwoFactorSettings('RegenerateRecoveryCodesUser', () =>
      HttpResponse.json({
        data: { regenerateRecoveryCodesUser: { user: { recoveryCodes: codes } } },
      })
    );

    await expect(run('SetupTwoFactorUser')).resolves.toEqual({
      kind: 'changed',
      settings: { status: 'disabled', otpauthUri, secret, recoveryCodes: null },
    });
    await expect(run('ConfirmTwoFactorUser')).resolves.toEqual({
      kind: 'changed',
      settings: { status: 'enabled', otpauthUri: null, secret: null, recoveryCodes: set },
    });
    await expect(run('DisableTwoFactorUser')).resolves.toEqual({
      kind: 'changed',
      settings: { status: 'disabled', otpauthUri: null, secret: null, recoveryCodes: null },
    });
    await expect(run('RegenerateRecoveryCodesUser')).resolves.toEqual({
      kind: 'changed',
      settings: { status: 'enabled', otpauthUri: null, secret: null, recoveryCodes: set },
    });
  });

  describe.each(OPERATIONS)('%s', (operation) => {
    it('carries the Bearer token, a clientMutationId and the code where one is sent', async () => {
      const answered = answerTwoFactorSettings(operation, () => HttpResponse.json({ data: null }));

      await run(operation);

      expect(answered).toHaveLength(1);
      expect(answered[0]?.authorization).toBe(`Bearer ${token}`);
      const input = answered[0]?.variables['input'] as Record<string, unknown>;
      expect(input['clientMutationId']).toEqual(expect.any(String));
      const sendsCode =
        operation === 'ConfirmTwoFactorUser' || operation === 'DisableTwoFactorUser';
      expect(input['twoFactorCode']).toBe(sendsCode ? dto.twoFactorCode : undefined);
    });

    it('clears the token on a transport 401 and ends the session', async () => {
      answerTwoFactorSettings(operation, (): Response => problem(401));

      await expect(run(operation)).resolves.toEqual(failed('session_ended'));
      expect(useAuthStore.getState().token).toBeNull();
    });

    it.each([
      ['no extensions', { message: 'Access Denied.' }],
      ['extensions.status 403', { message: 'Access Denied.', extensions: { status: 403 } }],
    ])('ends the session on "Access Denied." with %s and keeps the token', async (_n, error) => {
      answerTwoFactorSettings(operation, (): Response => graphQLError(error));

      await expect(run(operation)).resolves.toEqual(failed('session_ended'));
      expect(useAuthStore.getState().token).toBe(token);
    });

    it.each([
      ['HTTP 429', (): Response => problem(429), 'rate_limited'],
      ['HTTP 503', (): Response => problem(503), 'server'],
      ['a network failure', (): Response => HttpResponse.error(), 'network'],
      [
        'a code-less GraphQL error',
        (): Response => graphQLError({ message: 'Something odd' }),
        'server',
      ],
      ['an empty answer', (): Response => HttpResponse.json({ data: null }), 'server'],
    ] as const)('answers %s with %s', async (_name, respond, reason) => {
      const answered = answerTwoFactorSettings(operation, respond);

      await expect(run(operation)).resolves.toEqual(failed(reason));
      expect(answered).toHaveLength(1);
      expect(useAuthStore.getState().token).toBe(token);
    });

    it('answers a deadline as a network failure', async () => {
      jest
        .spyOn(DeadlineFetchAdapter.prototype, 'fetch')
        .mockRejectedValueOnce(new HttpError({ status: 0, message: 'Request timed out' }));

      await expect(run(operation)).resolves.toEqual(failed('network'));
    });

    it('sends nothing and settles as network for a signal aborted before the call', async () => {
      const answered = answerTwoFactorSettings(operation, () => HttpResponse.json({}));
      const controller = new AbortController();
      controller.abort();

      await expect(run(operation, controller.signal)).resolves.toEqual(failed('network'));
      expect(answered).toHaveLength(0);
    });
  });

  it.each([
    ['Two-factor authentication is already enabled.', 'already_enabled', 'SetupTwoFactorUser'],
    ['Two-factor setup not initiated.', 'setup_not_initiated', 'ConfirmTwoFactorUser'],
    ['Invalid two-factor code.', 'invalid_code', 'ConfirmTwoFactorUser'],
    ['Invalid two-factor code.', 'invalid_code', 'DisableTwoFactorUser'],
    ['Two-factor authentication is not enabled.', 'not_enabled', 'DisableTwoFactorUser'],
    ['Re-authentication required.', 'reauth_required', 'RegenerateRecoveryCodesUser'],
  ] as const)('maps "%s" to %s for %s', async (message, reason, operation) => {
    answerTwoFactorSettings(operation, () =>
      graphQLError({ message, extensions: { status: 403 } })
    );

    await expect(run(operation)).resolves.toEqual(failed(reason));
  });

  it('settles a malformed recovery code list as the server failure', async () => {
    answerTwoFactorSettings('ConfirmTwoFactorUser', () =>
      HttpResponse.json({ data: { confirmTwoFactorUser: { user: { recoveryCodes: 'x' } } } })
    );

    await expect(run('ConfirmTwoFactorUser')).resolves.toEqual(failed('server'));
  });
});
