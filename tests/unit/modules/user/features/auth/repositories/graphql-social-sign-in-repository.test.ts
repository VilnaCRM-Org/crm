import 'reflect-metadata';

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

import {
  CompleteSocialSignInDocument,
  InitiateSocialSignInDocument,
} from '@/api/generated/graphql';
import { GraphQLSocialSignInRepository } from '@auth/repositories';
import { buildToken } from '@tests/builders';

jest.mock('uuid', () => ({ v4: (): string => 'client-mutation-id' }));

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
      variables: { input: { provider: 'github', clientMutationId: 'client-mutation-id' } },
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
          clientMutationId: 'client-mutation-id',
        },
      },
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
  });

  it('rejects an answer that matches no documented shape', async () => {
    const { repository } = repositoryWith({ initiateSocialSignInUser: { user: null } });

    await expect(repository.initiate('google', new AbortController().signal)).rejects.toThrow();
  });
});
