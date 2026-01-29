import { ApolloError } from '@apollo/client';

import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import type { LoginUserDto, RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import UserRepository from '@/modules/User/repositories/UserRepository';
import type ApolloClientService from '@/services/ApolloClient/ApolloClientService';

jest.mock('uuid', (): { v4: () => string } => ({
  v4: (): string => 'mutation-id',
}));

describe('UserRepository', () => {
  it('logs in and normalizes email', async () => {
    const loginAPI = {
      login: jest.fn().mockResolvedValue({ token: 'token-123' }),
    } as unknown as Pick<LoginAPI, 'login'>;
    const apolloClientService = {
      getClient: jest.fn(),
    } as unknown as Pick<ApolloClientService, 'getClient'>;

    const repo = new UserRepository(
      loginAPI as LoginAPI,
      apolloClientService as ApolloClientService
    );
    const result = await repo.login({ email: 'Test@Example.com', password: 'p' } as LoginUserDto);

    expect(result.token).toBe('token-123');
    expect(result.email).toBe('test@example.com');
  });

  it('creates user via Apollo client and maps response', async () => {
    const loginAPI = { login: jest.fn() } as unknown as Pick<LoginAPI, 'login'>;
    const mutate = jest.fn().mockResolvedValue({
      data: { createUser: { user: { id: 'user-1', email: 'a@b.com' } } },
    });
    const apolloClientService = {
      getClient: jest.fn().mockReturnValue({ mutate }),
    } as unknown as Pick<ApolloClientService, 'getClient'>;

    const repo = new UserRepository(
      loginAPI as LoginAPI,
      apolloClientService as ApolloClientService
    );
    const input: RegisterUserDto = { fullName: ' Jane Doe ', email: 'a@b.com', password: 'p' };
    const result = await repo.createUser(input);

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            email: 'a@b.com',
            initials: 'Jane Doe',
            password: 'p',
            clientMutationId: 'mutation-id',
          },
        },
      })
    );
    expect(result).toEqual({ id: 'user-1', email: 'a@b.com' });
  });

  it('throws when createUser response is missing user', async () => {
    const loginAPI = { login: jest.fn() } as unknown as Pick<LoginAPI, 'login'>;
    const mutate = jest.fn().mockResolvedValue({ data: { createUser: { user: null } } });
    const apolloClientService = {
      getClient: jest.fn().mockReturnValue({ mutate }),
    } as unknown as Pick<ApolloClientService, 'getClient'>;

    const repo = new UserRepository(
      loginAPI as LoginAPI,
      apolloClientService as ApolloClientService
    );

    await expect(
      repo.createUser({ fullName: 'Jane', email: 'a@b.com', password: 'p' } as RegisterUserDto)
    ).rejects.toBeInstanceOf(ApolloError);
  });

  it('throws when createUser response has no data', async () => {
    const loginAPI = { login: jest.fn() } as unknown as Pick<LoginAPI, 'login'>;
    const mutate = jest.fn().mockResolvedValue({ data: undefined });
    const apolloClientService = {
      getClient: jest.fn().mockReturnValue({ mutate }),
    } as unknown as Pick<ApolloClientService, 'getClient'>;

    const repo = new UserRepository(
      loginAPI as LoginAPI,
      apolloClientService as ApolloClientService
    );

    await expect(
      repo.createUser({ fullName: 'Jane', email: 'a@b.com', password: 'p' } as RegisterUserDto)
    ).rejects.toBeInstanceOf(ApolloError);
  });
});
