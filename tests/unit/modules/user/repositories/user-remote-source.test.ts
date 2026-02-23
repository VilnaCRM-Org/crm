import { ApolloError } from '@apollo/client';

import API_ENDPOINTS from '@/config/api-config';
import UserRemoteSource from '@/modules/user/features/auth/repositories/user/sources/user.remote';
import type { LoginUserDto, RegisterUserDto } from '@/modules/user/features/auth/types/credentials';
import CREATE_USER from '@/modules/user/features/auth/types/graphql/mutations';

jest.mock('uuid', (): { v4: () => string } => ({
  v4: (): string => 'mutation-id',
}));

jest.mock('@/modules/user/lib/errors', () => ({
  handleApiError: jest.fn(() => new Error('mapped error')),
}));

describe('UserRemoteSource', () => {
  it('login delegates to https client and normalizes email', async () => {
    const httpsClient = {
      post: jest.fn().mockResolvedValue({ token: 'tok' }),
    };
    const apolloClient = { mutate: jest.fn() };
    const source = new UserRemoteSource(httpsClient as never, apolloClient as never);

    const credentials: LoginUserDto = { email: 'User@Test.COM', password: 'p' };
    const result = await source.login(credentials);

    expect(httpsClient.post).toHaveBeenCalledWith(API_ENDPOINTS.LOGIN, credentials, undefined);
    expect(result).toEqual({ token: 'tok', email: 'user@test.com' });
  });

  it('login maps errors using handleApiError', async () => {
    const httpsClient = {
      post: jest.fn().mockRejectedValue(new Error('raw error')),
    };
    const apolloClient = { mutate: jest.fn() };
    const source = new UserRemoteSource(httpsClient as never, apolloClient as never);

    await expect(source.login({ email: 'a@b.com', password: 'p' })).rejects.toThrow('mapped error');
  });

  it('createUser sends graphql mutation and maps result', async () => {
    const httpsClient = { post: jest.fn() };
    const mutate = jest.fn().mockResolvedValue({
      data: { createUser: { user: { id: 'u1', email: 'a@b.com' } } },
    });
    const apolloClient = { mutate };
    const source = new UserRemoteSource(httpsClient as never, apolloClient as never);

    const input: RegisterUserDto = { fullName: ' Jane Doe ', email: 'a@b.com', password: 'p' };
    const result = await source.createUser(input);

    expect(mutate).toHaveBeenCalledWith({
      mutation: CREATE_USER,
      variables: {
        input: {
          email: 'a@b.com',
          initials: 'Jane Doe',
          password: 'p',
          clientMutationId: 'mutation-id',
        },
      },
    });
    expect(result).toEqual({ id: 'u1', email: 'a@b.com' });
  });

  it('createUser throws when response has no user', async () => {
    const source = new UserRemoteSource(
      { post: jest.fn() } as never,
      { mutate: jest.fn().mockResolvedValue({ data: { createUser: { user: null } } }) } as never
    );

    await expect(
      source.createUser({ fullName: 'Jane', email: 'a@b.com', password: 'p' })
    ).rejects.toBeInstanceOf(ApolloError);
  });

  it('createUser throws when response has no data object', async () => {
    const source = new UserRemoteSource(
      { post: jest.fn() } as never,
      { mutate: jest.fn().mockResolvedValue({ data: undefined }) } as never
    );

    await expect(
      source.createUser({ fullName: 'Jane', email: 'a@b.com', password: 'p' })
    ).rejects.toBeInstanceOf(ApolloError);
  });

  it('createUser throws when response has no createUser field', async () => {
    const source = new UserRemoteSource(
      { post: jest.fn() } as never,
      { mutate: jest.fn().mockResolvedValue({ data: {} }) } as never
    );

    await expect(
      source.createUser({ fullName: 'Jane', email: 'a@b.com', password: 'p' })
    ).rejects.toBeInstanceOf(ApolloError);
  });
});
