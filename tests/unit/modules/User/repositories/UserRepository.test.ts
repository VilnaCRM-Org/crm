import { ApolloError } from '@apollo/client';

import type UserRemoteSource from '@/modules/user/features/auth/repositories/user/sources/user.remote';
import UserRepository from '@/modules/user/features/auth/repositories/user/user-repository';
import type { LoginUserDto, RegisterUserDto } from '@/modules/user/features/auth/types/credentials';

jest.mock('uuid', (): { v4: () => string } => ({
  v4: (): string => 'mutation-id',
}));

describe('UserRepository', () => {
  it('logs in and delegates to remote source', async () => {
    const remoteSource = {
      login: jest.fn().mockResolvedValue({ token: 'token-123', email: 'test@example.com' }),
      createUser: jest.fn(),
    } as unknown as UserRemoteSource;

    const repo = new UserRepository(remoteSource);
    const result = await repo.login({ email: 'Test@Example.com', password: 'p' } as LoginUserDto);

    expect(result.token).toBe('token-123');
    expect(result.email).toBe('test@example.com');
    expect(remoteSource.login).toHaveBeenCalledWith(
      { email: 'Test@Example.com', password: 'p' },
      undefined
    );
  });

  it('creates user via remote source and maps response', async () => {
    const remoteSource = {
      login: jest.fn(),
      createUser: jest.fn().mockResolvedValue({ id: 'user-1', email: 'a@b.com' }),
    } as unknown as UserRemoteSource;

    const repo = new UserRepository(remoteSource);
    const input: RegisterUserDto = { fullName: ' Jane Doe ', email: 'a@b.com', password: 'p' };
    const result = await repo.createUser(input);

    expect(result).toEqual({ id: 'user-1', email: 'a@b.com' });
    expect(remoteSource.createUser).toHaveBeenCalledWith(input);
  });

  it('throws when remote source createUser fails', async () => {
    const remoteSource = {
      login: jest.fn(),
      createUser: jest
        .fn()
        .mockRejectedValue(new ApolloError({ errorMessage: 'Failed to create user' })),
    } as unknown as UserRemoteSource;

    const repo = new UserRepository(remoteSource);

    await expect(
      repo.createUser({ fullName: 'Jane', email: 'a@b.com', password: 'p' } as RegisterUserDto)
    ).rejects.toBeInstanceOf(ApolloError);
  });

  it('passes signal option to remote source login', async () => {
    const remoteSource = {
      login: jest.fn().mockResolvedValue({ token: 'tok', email: 'a@b.com' }),
      createUser: jest.fn(),
    } as unknown as UserRemoteSource;

    const repo = new UserRepository(remoteSource);
    const controller = new AbortController();
    await repo.login({ email: 'a@b.com', password: 'p' } as LoginUserDto, {
      signal: controller.signal,
    });

    expect(remoteSource.login).toHaveBeenCalledWith(
      { email: 'a@b.com', password: 'p' },
      { signal: controller.signal }
    );
  });
});
