import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { AuthRepository } from '@auth/types/auth-repository';

describe('dependency-injection-config', () => {
  it('resolves AuthRepository and triggers the AuthRepositoryDeps factory', () => {
    const repo = container.resolve<AuthRepository>(AUTH_TOKENS.AuthRepository);

    expect(typeof repo.login).toBe('function');
    expect(typeof repo.register).toBe('function');
  });

  it('resolves a singleton ApolloClient from the GraphQL factory', () => {
    const client = container.resolve<ApolloClient<NormalizedCacheObject>>(AUTH_TOKENS.ApolloClient);

    expect(typeof client.mutate).toBe('function');
    expect(container.resolve(AUTH_TOKENS.ApolloClient)).toBe(client);
  });
});
