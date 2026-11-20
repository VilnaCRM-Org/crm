import 'reflect-metadata';

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

import {
  CompleteSocialSignInDocument,
  InitiateSocialSignInDocument,
} from '@/api/generated/graphql';
import { GraphQLSocialSignInRepository } from '@auth/repositories';
import { buildToken } from '@tests/builders';

const UUID_V4 = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/;

const mutationIdOf = (call: unknown[]): unknown =>
  (call[0] as { variables: { input: { clientMutationId: unknown } } }).variables.input
    .clientMutationId;

const repositoryWith = (
  data: unknown
): { repository: GraphQLSocialSignInRepository; mutate: jest.Mock } => {
  const mutate = jest.fn().mockResolvedValue({ data });
  const client = { mutate } as unknown as ApolloClient<NormalizedCacheObject>;
  return { repository: new GraphQLSocialSignInRepository(client), mutate };
};

describe('GraphQLSocialSignInRepository', () => {
  it('asks for the authorization URL of a provider, uncached, under its signal', async () => {
    const user = { authorizationUrl: 'https://github.com/login/oauth/authorize?x=1', state: 's-1' };
    const { repository, mutate } = repositoryWith({ initiateSocialSignInUser: { user } });
    const { signal } = new AbortController();

    await expect(repository.initiate('github', signal)).resolves.toEqual(user);

    expect(mutate).toHaveBeenCalledWith({
      mutation: InitiateSocialSignInDocument,
      variables: {
        input: { provider: 'github', clientMutationId: expect.stringMatching(UUID_V4) },
      },
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
  });

  it('completes with the provider, code and state, and returns the parsed user', async () => {
    const accessToken = buildToken();
    const { repository, mutate } = repositoryWith({
      completeSocialSignInUser: {
        user: { twoFactorEnabled: false, accessToken, pendingSessionId: null },
      },
    });
    const { signal } = new AbortController();

    await expect(
      repository.complete('google', { code: 'c-1', state: 's-1' }, signal)
    ).resolves.toEqual({ twoFactorEnabled: false, accessToken });

    expect(mutate).toHaveBeenCalledWith({
      mutation: CompleteSocialSignInDocument,
      variables: {
        input: {
          provider: 'google',
          code: 'c-1',
          state: 's-1',
          clientMutationId: expect.stringMatching(UUID_V4),
        },
      },
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
  });

  it('gives every initiation and completion its own mutation id', async () => {
    const { repository, mutate } = repositoryWith({
      initiateSocialSignInUser: { user: { authorizationUrl: 'https://x.test/a', state: 's' } },
      completeSocialSignInUser: { user: { twoFactorEnabled: false, accessToken: buildToken() } },
    });
    const { signal } = new AbortController();

    await repository.initiate('google', signal);
    await repository.initiate('google', signal);
    await repository.complete('google', { code: 'c', state: 's' }, signal);
    await repository.complete('google', { code: 'c', state: 's' }, signal);

    const ids = mutate.mock.calls.map(mutationIdOf);
    expect(ids).toEqual(Array.from({ length: 4 }, () => expect.stringMatching(UUID_V4)));
    expect(new Set(ids).size).toBe(4);
  });

  it('rejects an answer that matches no documented shape', async () => {
    const { repository } = repositoryWith({ initiateSocialSignInUser: { user: null } });

    await expect(repository.initiate('google', new AbortController().signal)).rejects.toThrow();
  });
});
