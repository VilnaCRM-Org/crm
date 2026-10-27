import 'reflect-metadata';

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

import {
  ConfirmTwoFactorUserDocument as CONFIRM,
  DisableTwoFactorUserDocument as DISABLE,
  RegenerateRecoveryCodesUserDocument as REGENERATE,
  SetupTwoFactorUserDocument as SETUP,
} from '@/api/generated/graphql';
import { GraphQLTwoFactorSettingsRepository } from '@/modules/user/features/settings/repositories';
import { buildTotpCode } from '@tests/builders';

interface FakeClient {
  readonly mutate: jest.Mock;
  readonly cache: { readonly write: jest.Mock };
}

interface MutateOptions {
  readonly mutation: unknown;
  readonly variables: { readonly input: Record<string, string> };
  readonly fetchPolicy: string;
  readonly context: unknown;
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const build = (): {
  repository: GraphQLTwoFactorSettingsRepository;
  client: FakeClient;
} => {
  const client: FakeClient = {
    mutate: jest.fn().mockResolvedValue({ data: { marker: true } }),
    cache: { write: jest.fn() },
  };
  const repository = new GraphQLTwoFactorSettingsRepository(
    client as unknown as ApolloClient<NormalizedCacheObject>
  );
  return { repository, client };
};

const abortedSignal = (): AbortSignal => {
  const controller = new AbortController();
  controller.abort();
  return controller.signal;
};

const optionsOf = (client: FakeClient, call = 0): MutateOptions =>
  client.mutate.mock.calls[call]?.[0] as MutateOptions;

describe('GraphQLTwoFactorSettingsRepository', () => {
  it('sends setup once with only a fresh clientMutationId, uncached', async () => {
    const { repository, client } = build();
    const { signal } = new AbortController();

    await expect(repository.setup(signal)).resolves.toEqual({ marker: true });

    expect(client.mutate).toHaveBeenCalledTimes(1);
    const options = optionsOf(client);
    expect(options.mutation).toBe(SETUP);
    expect(options.fetchPolicy).toBe('no-cache');
    expect(options.context).toEqual({ fetchOptions: { signal } });
    expect(options.variables.input).toEqual({ clientMutationId: expect.stringMatching(UUID_V4) });
  });

  it('sends confirm once with the dto code and a fresh clientMutationId, uncached', async () => {
    const { repository, client } = build();
    const { signal } = new AbortController();
    const twoFactorCode = buildTotpCode();

    await expect(repository.confirm({ twoFactorCode }, signal)).resolves.toEqual({ marker: true });

    expect(client.mutate).toHaveBeenCalledTimes(1);
    const options = optionsOf(client);
    expect(options.mutation).toBe(CONFIRM);
    expect(options.fetchPolicy).toBe('no-cache');
    expect(options.context).toEqual({ fetchOptions: { signal } });
    expect(options.variables.input).toEqual({
      twoFactorCode,
      clientMutationId: expect.stringMatching(UUID_V4),
    });
  });

  it('sends disable once with the dto code and a fresh clientMutationId, uncached', async () => {
    const { repository, client } = build();
    const { signal } = new AbortController();
    const twoFactorCode = buildTotpCode();

    await expect(repository.disable({ twoFactorCode }, signal)).resolves.toEqual({ marker: true });

    expect(client.mutate).toHaveBeenCalledTimes(1);
    const options = optionsOf(client);
    expect(options.mutation).toBe(DISABLE);
    expect(options.fetchPolicy).toBe('no-cache');
    expect(options.context).toEqual({ fetchOptions: { signal } });
    expect(options.variables.input).toEqual({
      twoFactorCode,
      clientMutationId: expect.stringMatching(UUID_V4),
    });
  });

  it('sends regenerate once with only a fresh clientMutationId, uncached', async () => {
    const { repository, client } = build();
    const { signal } = new AbortController();

    await expect(repository.regenerate(signal)).resolves.toEqual({ marker: true });

    expect(client.mutate).toHaveBeenCalledTimes(1);
    const options = optionsOf(client);
    expect(options.mutation).toBe(REGENERATE);
    expect(options.fetchPolicy).toBe('no-cache');
    expect(options.context).toEqual({ fetchOptions: { signal } });
    expect(options.variables.input).toEqual({ clientMutationId: expect.stringMatching(UUID_V4) });
  });

  it('generates a different clientMutationId for every call', async () => {
    const { repository, client } = build();
    const { signal } = new AbortController();

    await repository.setup(signal);
    await repository.setup(signal);

    expect(optionsOf(client, 0).variables.input['clientMutationId']).not.toBe(
      optionsOf(client, 1).variables.input['clientMutationId']
    );
  });

  it('never writes to the cache', async () => {
    const { repository, client } = build();
    const { signal } = new AbortController();
    const dto = { twoFactorCode: buildTotpCode() };

    await repository.setup(signal);
    await repository.confirm(dto, signal);
    await repository.disable(dto, signal);
    await repository.regenerate(signal);

    expect(client.cache.write).not.toHaveBeenCalled();
  });

  it.each([
    [
      'setup',
      (repository: GraphQLTwoFactorSettingsRepository, signal: AbortSignal): Promise<unknown> =>
        repository.setup(signal),
    ],
    [
      'confirm',
      (repository: GraphQLTwoFactorSettingsRepository, signal: AbortSignal): Promise<unknown> =>
        repository.confirm({ twoFactorCode: buildTotpCode() }, signal),
    ],
    [
      'disable',
      (repository: GraphQLTwoFactorSettingsRepository, signal: AbortSignal): Promise<unknown> =>
        repository.disable({ twoFactorCode: buildTotpCode() }, signal),
    ],
    [
      'regenerate',
      (repository: GraphQLTwoFactorSettingsRepository, signal: AbortSignal): Promise<unknown> =>
        repository.regenerate(signal),
    ],
  ])('throws an AbortError from %s before calling the client when aborted', async (_n, run) => {
    const { repository, client } = build();

    const caught = await run(repository, abortedSignal()).catch((error: unknown) => error);

    expect(caught).toBeInstanceOf(DOMException);
    expect((caught as DOMException).name).toBe('AbortError');
    expect((caught as DOMException).message).toBe('Two-factor settings request was aborted');
    expect(client.mutate).not.toHaveBeenCalled();
  });

  it('returns null when the client answers without data', async () => {
    const { repository, client } = build();
    client.mutate.mockResolvedValue({ data: undefined });

    await expect(repository.setup(new AbortController().signal)).resolves.toBeNull();
  });

  it('passes a client rejection through unchanged', async () => {
    const { repository, client } = build();
    const failure = new Error('boom');
    client.mutate.mockRejectedValue(failure);
    const { signal } = new AbortController();

    await expect(repository.setup(signal)).rejects.toBe(failure);
    await expect(repository.confirm({ twoFactorCode: buildTotpCode() }, signal)).rejects.toBe(
      failure
    );
    await expect(repository.disable({ twoFactorCode: buildTotpCode() }, signal)).rejects.toBe(
      failure
    );
    await expect(repository.regenerate(signal)).rejects.toBe(failure);
  });
});
