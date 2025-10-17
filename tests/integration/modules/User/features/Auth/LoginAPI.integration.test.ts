import { rest } from 'msw';

import '../../../../setup';
import API_ENDPOINTS from '@/config/apiConfig';
import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import { AuthenticationError } from '@/modules/User/features/Auth/api/ApiErrors';
import LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';

import server from '../../../../mocks/server';

describe('LoginAPI Integration', () => {
  let loginAPI: LoginAPI;

  beforeEach(() => {
    // Resolve from actual DI container
    loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
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

      const result = await loginAPI.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should send correct request body', async () => {
      let requestBody: Record<string, string> | null = null;

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, async (req, res, ctx) => {
          requestBody = await req.json();
          return res(ctx.status(200), ctx.json({ token: 'abc' }));
        })
      );

      await loginAPI.login({
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
        loginAPI.login({ email: 'wrong@test.com', password: 'wrongpass' })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw ApiError with correct message for 400 status', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Bad request' }))
        )
      );

      await expect(loginAPI.login({ email: 'invalid', password: '123' })).rejects.toThrow(
        'Invalid login data'
      );
    });

    it('should throw ApiError for 403 status', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(403), ctx.json({ message: 'Forbidden' }))
        )
      );

      await expect(loginAPI.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(
        'Forbidden'
      );
    });

    it('should throw ApiError for 404 status', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(404), ctx.json({ message: 'Not found' }))
        )
      );

      await expect(loginAPI.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(
        'Login not found'
      );
    });

    it('should throw ApiError for 408 timeout', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(408), ctx.json({ message: 'Request timeout' }))
        )
      );

      await expect(loginAPI.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(
        'Request timed out. Please try again.'
      );
    });

    it('should throw ApiError for 429 rate limit', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(429), ctx.json({ message: 'Too many requests' }))
        )
      );

      await expect(loginAPI.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(
        'Too many requests. Please slow down.'
      );
    });

    it('should throw ApiError for 500 server error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Internal server error' }))
        )
      );

      await expect(loginAPI.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(
        'Server error. Please try again later.'
      );
    });

    it('should throw ApiError for 502 bad gateway', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(502), ctx.json({ message: 'Bad gateway' }))
        )
      );

      await expect(loginAPI.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(
        'Service unavailable. Please try again later.'
      );
    });

    it('should throw ApiError for 503 service unavailable', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(503), ctx.json({ message: 'Service unavailable' }))
        )
      );

      await expect(loginAPI.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(
        'Service unavailable. Please try again later.'
      );
    });

    it('should throw ApiError for 504 gateway timeout', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(504), ctx.json({ message: 'Gateway timeout' }))
        )
      );

      await expect(loginAPI.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(
        'Service unavailable. Please try again later.'
      );
    });

    it('should handle network errors', async () => {
      server.use(rest.post(API_ENDPOINTS.LOGIN, (_, res) => res.networkError('Failed to fetch')));

      await expect(loginAPI.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(
        'Network error. Please check your connection.'
      );
    });
  });

  describe('request cancellation', () => {
    it('should handle request cancellation via AbortSignal', async () => {
      const controller = new AbortController();

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, async (_, res, ctx) => {
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 100);
          });
          return res(ctx.status(200), ctx.json({ token: 'abc' }));
        })
      );

      const promise = loginAPI.login(
        { email: 'test@test.com', password: 'pass' },
        { signal: controller.signal }
      );

      controller.abort();

      await expect(promise).rejects.toThrow('Request canceled.');
    });

    it('should not throw if request completes before cancellation', async () => {
      const controller = new AbortController();
      const mockResponse = { token: 'abc' };

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(mockResponse))
        )
      );

      const result = await loginAPI.login(
        { email: 'test@test.com', password: 'pass' },
        { signal: controller.signal }
      );

      controller.abort();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('DI container integration', () => {
    it('should be resolvable from DI container multiple times', () => {
      const instance1 = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      const instance2 = container.resolve<LoginAPI>(TOKENS.LoginAPI);

      expect(instance1).toBeInstanceOf(LoginAPI);
      expect(instance2).toBeInstanceOf(LoginAPI);
    });
  });
});
