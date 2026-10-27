import 'reflect-metadata';

import { ApolloError } from '@apollo/client';

import { TwoFactorSettingsProvider } from '@/modules/user/features/settings/data-providers';
import { GraphQLTwoFactorSettingsTransformer } from '@/modules/user/features/settings/transformers';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import {
  buildOtpauthUri,
  buildRecoveryCodeSet,
  buildTotpCode,
  buildTotpSecret,
} from '@tests/builders';

interface FakeRepository {
  readonly setup: jest.Mock;
  readonly confirm: jest.Mock;
  readonly disable: jest.Mock;
  readonly regenerate: jest.Mock;
}

const build = (): {
  provider: TwoFactorSettingsProvider;
  repository: FakeRepository;
  transformer: GraphQLTwoFactorSettingsTransformer;
} => {
  const repository: FakeRepository = {
    setup: jest.fn(),
    confirm: jest.fn(),
    disable: jest.fn(),
    regenerate: jest.fn(),
  };
  const transformer = new GraphQLTwoFactorSettingsTransformer();
  const provider = new TwoFactorSettingsProvider(
    repository as unknown as ConstructorParameters<typeof TwoFactorSettingsProvider>[0],
    transformer,
    new UserServiceErrorTransformer()
  );
  return { provider, repository, transformer };
};

const { signal } = new AbortController();
const dto = { twoFactorCode: buildTotpCode() };

const graphQLFailure = (message: string, status?: number): ApolloError =>
  new ApolloError({
    graphQLErrors: [{ message, ...(status === undefined ? {} : { extensions: { status } }) }],
  });

describe('TwoFactorSettingsProvider', () => {
  it('sets up through the repository and returns the transformer outcome', async () => {
    const { provider, repository } = build();
    const otpauthUri = buildOtpauthUri();
    const secret = buildTotpSecret();
    repository.setup.mockResolvedValue({ setupTwoFactorUser: { user: { otpauthUri, secret } } });

    await expect(provider.setup(signal)).resolves.toEqual({
      kind: 'changed',
      settings: { status: 'disabled', otpauthUri, secret, recoveryCodes: null },
    });
    expect(repository.setup).toHaveBeenCalledWith(signal);
    expect(repository.setup).toHaveBeenCalledTimes(1);
  });

  it('confirms with the dto and returns the recovery code set', async () => {
    const { provider, repository } = build();
    const set = buildRecoveryCodeSet();
    repository.confirm.mockResolvedValue({
      confirmTwoFactorUser: { user: { recoveryCodes: set.items.map((code) => code.value) } },
    });

    await expect(provider.confirm(dto, signal)).resolves.toEqual({
      kind: 'changed',
      settings: { status: 'enabled', otpauthUri: null, secret: null, recoveryCodes: set },
    });
    expect(repository.confirm).toHaveBeenCalledWith(dto, signal);
  });

  it('disables with the dto and returns status disabled', async () => {
    const { provider, repository } = build();
    repository.disable.mockResolvedValue({ disableTwoFactorUser: { user: { success: true } } });

    await expect(provider.disable(dto, signal)).resolves.toEqual({
      kind: 'changed',
      settings: { status: 'disabled', otpauthUri: null, secret: null, recoveryCodes: null },
    });
    expect(repository.disable).toHaveBeenCalledWith(dto, signal);
  });

  it('regenerates and returns the new set with status enabled', async () => {
    const { provider, repository } = build();
    const set = buildRecoveryCodeSet();
    repository.regenerate.mockResolvedValue({
      regenerateRecoveryCodesUser: { user: { recoveryCodes: set.items.map((c) => c.value) } },
    });

    await expect(provider.regenerate(signal)).resolves.toEqual({
      kind: 'changed',
      settings: { status: 'enabled', otpauthUri: null, secret: null, recoveryCodes: set },
    });
    expect(repository.regenerate).toHaveBeenCalledWith(signal);
  });

  it.each([
    ['Two-factor authentication is already enabled.', 'already_enabled'],
    ['Two-factor authentication is not enabled.', 'not_enabled'],
    ['Two-factor setup not initiated.', 'setup_not_initiated'],
    ['Invalid two-factor code.', 'invalid_code'],
    ['twoFactorCode: This value is not valid.', 'invalid_code'],
    ['Re-authentication required.', 'reauth_required'],
    ['Access Denied.', 'session_ended'],
  ])('settles "%s" as the %s failure for every operation', async (message, reason) => {
    const { provider, repository } = build();
    const caught = graphQLFailure(message);
    for (const method of ['setup', 'confirm', 'disable', 'regenerate'] as const) {
      repository[method].mockRejectedValue(caught);
    }

    const outcomes = await Promise.all([
      provider.setup(signal),
      provider.confirm(dto, signal),
      provider.disable(dto, signal),
      provider.regenerate(signal),
    ]);

    expect(outcomes).toEqual(Array.from({ length: 4 }, () => ({ kind: 'failed', reason })));
  });

  it('settles a status 401, 429 and 503 as session_ended, rate_limited and server', async () => {
    const { provider, repository } = build();
    repository.setup
      .mockRejectedValueOnce(graphQLFailure('Unauthorized', 401))
      .mockRejectedValueOnce(graphQLFailure('Too many', 429))
      .mockRejectedValueOnce(
        new ApolloError({ networkError: Object.assign(new Error('x'), { statusCode: 503 }) })
      );

    await expect(provider.setup(signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'session_ended',
    });
    await expect(provider.setup(signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'rate_limited',
    });
    await expect(provider.setup(signal)).resolves.toEqual({ kind: 'failed', reason: 'server' });
  });

  it('settles an aborted signal and a network failure as network', async () => {
    const { provider, repository } = build();
    const controller = new AbortController();
    controller.abort();
    repository.setup.mockRejectedValueOnce(new DOMException('aborted', 'AbortError'));
    repository.confirm.mockRejectedValueOnce(
      new ApolloError({ networkError: new Error('Failed to fetch') })
    );

    await expect(provider.setup(controller.signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'network',
    });
    await expect(provider.confirm(dto, signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'network',
    });
  });

  it('settles an empty answer as the server failure', async () => {
    const { provider, repository } = build();
    repository.disable.mockResolvedValue(null);

    await expect(provider.disable(dto, signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'server',
    });
  });
});
