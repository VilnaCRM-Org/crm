import { ApolloError } from '@apollo/client';
import { rest } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import RegistrationAPI from '@/modules/user/features/auth/repositories/registration-api';
import { ApiError, ConflictError } from '@/modules/user/types/api-errors';
import ApiErrorFactory from '@auth/repositories/api-error-factory';

import server, { GRAPHQL_URL } from '../../../../mocks/server';

type ApolloClientLike = import('@apollo/client').ApolloClient<
  import('@apollo/client').NormalizedCacheObject
>;

const credentials = {
  email: 'newuser@example.com',
  password: 'securepass123',
  fullName: 'New User',
};

const createUserSuccessBody = {
  data: {
    createUser: {
      user: { id: 'user-123', confirmed: true, email: 'newuser@example.com', initials: 'New User' },
      clientMutationId: 'client-mutation-id',
    },
  },
};

describe('RegistrationAPI Integration', () => {
  let registrationAPI: RegistrationAPI;

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    registrationAPI = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);
  });

  describe('successful registration', () => {
    it('creates the user via the GraphQL mutation and maps the payload', async () => {
      let capturedInput: Record<string, string> | undefined;

      server.use(
        rest.post(GRAPHQL_URL, async (req, res, ctx) => {
          const body = (await req.json()) as { variables?: { input?: Record<string, string> } };
          capturedInput = body.variables?.input;
          return res(ctx.status(200), ctx.json(createUserSuccessBody));
        })
      );

      const result = await registrationAPI.register(credentials);

      expect(result).toEqual({ email: 'newuser@example.com', fullName: 'New User' });
      expect(capturedInput).toEqual({
        email: 'newuser@example.com',
        initials: 'New User',
        password: 'securepass123',
        clientMutationId: expect.any(String),
      });
    });

    it('trims the full name into initials before sending', async () => {
      let capturedInput: Record<string, string> | undefined;

      server.use(
        rest.post(GRAPHQL_URL, async (req, res, ctx) => {
          const body = (await req.json()) as { variables?: { input?: Record<string, string> } };
          capturedInput = body.variables?.input;
          return res(ctx.status(200), ctx.json(createUserSuccessBody));
        })
      );

      await registrationAPI.register({ ...credentials, fullName: '  New User  ' });

      expect(capturedInput?.initials).toBe('New User');
    });
  });

  describe('empty responses', () => {
    it.each([
      ['data is null', { data: null }],
      ['createUser is null', { data: { createUser: null } }],
      ['user is null', { data: { createUser: { user: null } } }],
    ])('resolves to undefined when %s', async (_label, body) => {
      server.use(rest.post(GRAPHQL_URL, (_req, res, ctx) => res(ctx.status(200), ctx.json(body))));

      await expect(registrationAPI.register(credentials)).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('maps a 409 duplicate-email response to a ConflictError', async () => {
      server.use(
        rest.post(GRAPHQL_URL, (_req, res, ctx) =>
          res(
            ctx.status(409),
            ctx.json({
              errors: [
                {
                  message: 'Email already exists',
                  extensions: { code: 'CONFLICT', http: { status: 409 } },
                },
              ],
            })
          )
        )
      );

      await expect(registrationAPI.register(credentials)).rejects.toBeInstanceOf(ConflictError);
    });

    it('throws an ApiError on a GraphQL error response without a status', async () => {
      server.use(
        rest.post(GRAPHQL_URL, (_req, res, ctx) =>
          res(ctx.status(200), ctx.json({ data: null, errors: [{ message: 'Something wrong' }] }))
        )
      );

      await expect(registrationAPI.register(credentials)).rejects.toBeInstanceOf(ApiError);
    });

    it('converts an Apollo error that carries no http status generically', async () => {
      const mutate = jest
        .fn()
        .mockRejectedValue(new ApolloError({ graphQLErrors: [{ message: 'no status' } as never] }));
      const api = new RegistrationAPI(
        { mutate } as unknown as ApolloClientLike,
        new ApiErrorFactory()
      );

      await expect(api.register(credentials)).rejects.toBeInstanceOf(ApiError);
    });

    it('throws an ApiError on a network failure', async () => {
      server.use(rest.post(GRAPHQL_URL, (_req, res) => res.networkError('Failed to fetch')));

      await expect(registrationAPI.register(credentials)).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe('request cancellation', () => {
    it('throws an AbortError when the signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      server.use(
        rest.post(GRAPHQL_URL, (_req, res, ctx) =>
          res(ctx.status(500), ctx.json({ errors: [{ message: 'unused' }] }))
        )
      );

      await expect(
        registrationAPI.register(credentials, { signal: controller.signal })
      ).rejects.toMatchObject({ name: 'AbortError' });
    });
  });

  describe('DI container integration', () => {
    it('is resolvable from the DI container multiple times', () => {
      const instance1 = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);
      const instance2 = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);

      expect(instance1).toBeInstanceOf(RegistrationAPI);
      expect(instance2).toBeInstanceOf(RegistrationAPI);
    });
  });
});
