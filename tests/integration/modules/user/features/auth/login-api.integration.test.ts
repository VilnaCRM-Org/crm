import { rest } from 'msw';

import '../../../../setup';
import API_ENDPOINTS from '@/config/api-config';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import UserRemoteSource from '@/modules/user/features/auth/repositories/user/sources/user.remote';
import { AuthenticationError } from '@/modules/user/types/api-errors';

import server from '../../../../mocks/server';

describe('UserRemoteSource Integration (Login)', () => {
  let userRemoteSource: UserRemoteSource;

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    // Resolve from actual DI container
    userRemoteSource = container.resolve<UserRemoteSource>(TOKENS.UserRemoteSource);
  });

  describe('successful login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        token: 'abc123-token',
      };

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(mockResponse))
        )
      );

      const result = await userRemoteSource.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        token: mockResponse.token,
        email: 'test@example.com',
      });
    });

    it('should send correct request body', async () => {
      let requestBody: Record<string, string> | null = null;

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, async (req, res, ctx) => {
          requestBody = await req.json();
          return res(ctx.status(200), ctx.json({ token: 'abc' }));
        })
      );

      await userRemoteSource.login({
        email: 'user@test.com',
        password: 'mypassword',
      });

      expect(requestBody).toEqual({
        email: 'user@test.com',
        password: 'mypassword',
      });
    });
  });

  describe('error handling', () => {
    it('should throw AuthenticationError on 401 response', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
        )
      );

      await expect(
        userRemoteSource.login({ email: 'wrong@test.com', password: 'wrongpass' })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw ApiError with correct message for 400 status', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Bad request' }))
        )
      );

      await expect(
        userRemoteSource.login({ email: 'invalid', password: '123' })
      ).rejects.toThrow('Invalid login data');
    });

    it('should throw ApiError for 403 status', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(403), ctx.json({ message: 'Forbidden' }))
        )
      );

      await expect(
        userRemoteSource.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Forbidden');
    });

    it('should throw ApiError for 404 status', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(404), ctx.json({ message: 'Not found' }))
        )
      );

      await expect(
        userRemoteSource.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Login not found');
    });

    it('should handle 408 timeout', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(408), ctx.json({ message: 'Request timeout' }))
        )
      );

      await expect(
        userRemoteSource.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Request timed out. Please try again.');
    });

    it('should throw ApiError for 429 rate limit', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(429), ctx.json({ message: 'Too many requests' }))
        )
      );

      await expect(
        userRemoteSource.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Too many requests. Please slow down.');
    });

    it('should throw ApiError for 500 server error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Internal server error' }))
        )
      );

      await expect(
        userRemoteSource.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Server error. Please try again later.');
    });

    it('should throw ApiError for 502 bad gateway', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(502), ctx.json({ message: 'Bad gateway' }))
        )
      );

      await expect(
        userRemoteSource.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Service unavailable. Please try again later.');
    });

    it('should throw ApiError for 503 service unavailable', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(503), ctx.json({ message: 'Service unavailable' }))
        )
      );

      await expect(
        userRemoteSource.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Service unavailable. Please try again later.');
    });

    it('should handle 504 gateway timeout', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(504), ctx.json({ message: 'Gateway timeout' }))
        )
      );

      await expect(
        userRemoteSource.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Service unavailable. Please try again later.');
    });

    it('should handle network errors', async () => {
      server.use(rest.post(API_ENDPOINTS.LOGIN, (_, res) => res.networkError('Failed to fetch')));

      await expect(
        userRemoteSource.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Network error. Please check your connection.');
    });
  });

  describe('request cancellation', () => {
    it('should handle pre-aborted AbortSignal', async () => {
      const controller = new AbortController();

      // Abort before making the request
      controller.abort();

      await expect(
        userRemoteSource.login(
          { email: 'test@test.com', password: 'pass' },
          { signal: controller.signal }
        )
      ).rejects.toThrow();
    });

    it('should not throw if request completes before cancellation', async () => {
      const controller = new AbortController();
      const mockResponse = { token: 'abc' };

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(mockResponse))
        )
      );

      const result = await userRemoteSource.login(
        { email: 'test@test.com', password: 'pass' },
        { signal: controller.signal }
      );

      controller.abort();

      expect(result).toEqual({
        token: mockResponse.token,
        email: 'test@test.com',
      });
    });
  });

  describe('DI container integration', () => {
    it('should be resolvable from DI container multiple times', () => {
      const instance1 = container.resolve<UserRemoteSource>(TOKENS.UserRemoteSource);
      const instance2 = container.resolve<UserRemoteSource>(TOKENS.UserRemoteSource);

      expect(instance1).toBeInstanceOf(UserRemoteSource);
      expect(instance2).toBeInstanceOf(UserRemoteSource);
    });
  });
});
