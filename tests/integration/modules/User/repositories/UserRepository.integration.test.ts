import '../../../setup';

import { rest } from 'msw';

import API_ENDPOINTS from '@/config/apiConfig';
import LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import UserRepository from '@/modules/User/repositories/UserRepository';
import ApolloClientService from '@/services/ApolloClient/ApolloClientService';
import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';

import server from '../../../mocks/server';

describe('UserRepository Integration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.REACT_APP_GRAPHQL_URL = 'http://localhost:4000/graphql';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('logs in and normalizes email to lowercase', async () => {
    const httpsClient = new FetchHttpsClient();
    const loginApi = new LoginAPI(httpsClient);
    const apolloClientService = new ApolloClientService();
    const repository = new UserRepository(loginApi, apolloClientService);

    const result = await repository.login({ email: 'Test@Example.com', password: 'password' });

    expect(result).toEqual({
      token: 'default-token-123',
      email: 'test@example.com',
    });
  });

  it('creates a user via GraphQL and maps response', async () => {
    const httpsClient = new FetchHttpsClient();
    const loginApi = new LoginAPI(httpsClient);
    const apolloClientService = new ApolloClientService();
    const repository = new UserRepository(loginApi, apolloClientService);

    let capturedVariables: Record<string, string> | undefined;

    server.use(
      rest.post('http://localhost:4000/graphql', async (req, res, ctx) => {
        const body = (await req.json()) as { variables?: { input?: Record<string, string> } };
        capturedVariables = body.variables?.input;

        return res(
          ctx.status(200),
          ctx.json({
            data: {
              createUser: {
                user: {
                  id: 'user-123',
                  email: 'test@example.com',
                  confirmed: false,
                  initials: 'Test User',
                },
                clientMutationId: 'client-mutation-id',
              },
            },
          })
        );
      })
    );

    const result = await repository.createUser({
      fullName: ' Test User ',
      email: 'test@example.com',
      password: 'pass123',
    });

    expect(result).toEqual({
      id: 'user-123',
      email: 'test@example.com',
    });

    expect(capturedVariables).toEqual({
      email: 'test@example.com',
      initials: 'Test User',
      password: 'pass123',
      clientMutationId: expect.any(String),
    });
  });

  it('throws when GraphQL response is missing user data', async () => {
    const httpsClient = new FetchHttpsClient();
    const loginApi = new LoginAPI(httpsClient);
    const apolloClientService = new ApolloClientService();
    const repository = new UserRepository(loginApi, apolloClientService);

    server.use(
      rest.post('http://localhost:4000/graphql', (_req, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            data: {
              createUser: {
                user: null,
                clientMutationId: 'client-mutation-id',
              },
            },
          })
        )
      )
    );

    await expect(
      repository.createUser({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
      })
    ).rejects.toThrow('Failed to create user');
  });

  it('throws when GraphQL response is missing data', async () => {
    const httpsClient = new FetchHttpsClient();
    const loginApi = new LoginAPI(httpsClient);
    const apolloClientService = new ApolloClientService();
    const repository = new UserRepository(loginApi, apolloClientService);

    server.use(
      rest.post('http://localhost:4000/graphql', (_req, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({})
        )
      )
    );

    await expect(
      repository.createUser({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
      })
    ).rejects.toThrow('Server response was missing for query');
  });

  it('throws when GraphQL response data is undefined', async () => {
    const httpsClient = new FetchHttpsClient();
    const loginApi = new LoginAPI(httpsClient);
    const apolloClientService = new ApolloClientService();
    const repository = new UserRepository(loginApi, apolloClientService);

    jest
      .spyOn(apolloClientService, 'getClient')
      .mockReturnValue({ mutate: jest.fn().mockResolvedValue({ data: undefined }) } as never);

    await expect(
      repository.createUser({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
      })
    ).rejects.toThrow('Failed to create user');
  });

  it('throws when GraphQL response is missing createUser payload', async () => {
    const httpsClient = new FetchHttpsClient();
    const loginApi = new LoginAPI(httpsClient);
    const apolloClientService = new ApolloClientService();
    const repository = new UserRepository(loginApi, apolloClientService);

    jest.spyOn(apolloClientService, 'getClient').mockReturnValue({
      mutate: jest.fn().mockResolvedValue({ data: { createUser: undefined } }),
    } as never);

    await expect(
      repository.createUser({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
      })
    ).rejects.toThrow('Failed to create user');
  });

  it('uses the configured REST endpoint for login', async () => {
    const httpsClient = new FetchHttpsClient();
    const loginApi = new LoginAPI(httpsClient);
    const apolloClientService = new ApolloClientService();
    const repository = new UserRepository(loginApi, apolloClientService);

    let requestUrl: string | null = null;

    server.use(
      rest.post(API_ENDPOINTS.LOGIN, (req, res, ctx) => {
        requestUrl = req.url.toString();
        return res(ctx.status(200), ctx.json({ token: 'login-token' }));
      })
    );

    await repository.login({ email: 'tester@example.com', password: 'password' });

    expect(requestUrl).toBe(API_ENDPOINTS.LOGIN);
  });
});
