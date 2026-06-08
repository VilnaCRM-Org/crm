import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import type { AuthRepository } from '@auth/types/auth-repository';

describe('dependency-injection-config', () => {
  it('resolves AuthRepository and triggers the AuthRepositoryDeps factory', () => {
    const repo = container.resolve<AuthRepository>(TOKENS.AuthRepository);

    expect(typeof repo.login).toBe('function');
    expect(typeof repo.register).toBe('function');
  });

  it('resolves a singleton ApolloClient from the GraphQL factory', () => {
    const client = container.resolve<ApolloClient<NormalizedCacheObject>>(TOKENS.ApolloClient);

    expect(typeof client.mutate).toBe('function');
    expect(container.resolve(TOKENS.ApolloClient)).toBe(client);
  });
});
