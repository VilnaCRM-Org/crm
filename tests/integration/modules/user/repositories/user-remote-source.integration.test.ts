import '../../../setup';

import { ApolloError } from '@apollo/client';

import UserRemoteSource from '@/modules/user/features/auth/repositories/user/sources/user.remote';
import type HttpsClient from '@/services/https-client/https-client';

const mockHttpsClient = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
} as unknown as HttpsClient;

describe('UserRemoteSource createUser branch coverage', () => {
  it('throws when mutate returns data with createUser undefined', async () => {
    const mockApolloClient = {
      mutate: jest.fn().mockResolvedValue({ data: { createUser: undefined } }),
    };

    const source = new UserRemoteSource(mockHttpsClient, mockApolloClient as never);

    await expect(
      source.createUser({ fullName: 'Test', email: 'a@b.com', password: 'p' })
    ).rejects.toBeInstanceOf(ApolloError);
  });

  it('throws when mutate returns data undefined', async () => {
    const mockApolloClient = {
      mutate: jest.fn().mockResolvedValue({ data: undefined }),
    };

    const source = new UserRemoteSource(mockHttpsClient, mockApolloClient as never);

    await expect(
      source.createUser({ fullName: 'Test', email: 'a@b.com', password: 'p' })
    ).rejects.toBeInstanceOf(ApolloError);
  });

  it('throws when mutate returns data with createUser.user null', async () => {
    const mockApolloClient = {
      mutate: jest.fn().mockResolvedValue({ data: { createUser: { user: null } } }),
    };

    const source = new UserRemoteSource(mockHttpsClient, mockApolloClient as never);

    await expect(
      source.createUser({ fullName: 'Test', email: 'a@b.com', password: 'p' })
    ).rejects.toBeInstanceOf(ApolloError);
  });

  it('returns user data when mutate succeeds', async () => {
    const mockApolloClient = {
      mutate: jest.fn().mockResolvedValue({
        data: {
          createUser: {
            user: { id: 'u1', email: 'a@b.com' },
          },
        },
      }),
    };

    const source = new UserRemoteSource(mockHttpsClient, mockApolloClient as never);

    const result = await source.createUser({ fullName: ' Jane ', email: 'a@b.com', password: 'p' });

    expect(result).toEqual({ id: 'u1', email: 'a@b.com' });
  });
});
