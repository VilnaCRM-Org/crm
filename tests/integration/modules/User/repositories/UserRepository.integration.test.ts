import '../../../setup';

import { rest } from 'msw';

import API_ENDPOINTS from '@/config/api-config';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import type { IUserRepository } from '@/modules/user/features/auth/repositories/user/user-repository.types';

import server from '../../../mocks/server';

describe('UserRepository Integration', () => {
  let repository: IUserRepository;
  const originalEnv = { ...process.env };

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    process.env = { ...originalEnv };
  });
  afterAll(() => server.close());

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.REACT_APP_GRAPHQL_URL = 'http://localhost:4000/graphql';
    repository = container.resolve<IUserRepository>(TOKENS.UserRepository);
  });

  it('logs in and normalizes email to lowercase', async () => {
    const result = await repository.login({ email: 'Test@Example.com', password: 'password' });

    expect(result).toEqual({
      token: 'default-token-123',
      email: 'test@example.com',
    });
  });

  it('creates a user via GraphQL and maps response', async () => {
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
    server.use(
      rest.post('http://localhost:4000/graphql', (_req, res, ctx) => res(ctx.status(200), ctx.json({})))
    );

    await expect(
      repository.createUser({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
      })
    ).rejects.toThrow('Server response was missing for query');
  });

  it('throws when GraphQL response has data but createUser is undefined', async () => {
    server.use(
      rest.post('http://localhost:4000/graphql', (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ data: { createUser: null } }))
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

  it('throws when GraphQL response has createUser but user is undefined', async () => {
    server.use(
      rest.post('http://localhost:4000/graphql', (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ data: { createUser: { user: undefined } } }))
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

  it('uses the configured REST endpoint for login', async () => {
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
