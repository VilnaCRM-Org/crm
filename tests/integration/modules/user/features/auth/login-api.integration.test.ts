import { rest } from 'msw';

import '../../../../setup';
import API_ENDPOINTS from '@/config/api-config';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import LoginAPI from '@/modules/user/features/auth/repositories/login-api';
import { AuthenticationError } from '@/modules/user/lib/api-errors';
import { buildCredentials, buildLoginResponse } from '@tests/builders';

import server from '../../../../mocks/server';

describe('LoginAPI Integration', () => {
  let loginAPI: LoginAPI;

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    // Resolve from actual DI container
    loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
  });

  describe('successful login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = buildLoginResponse();

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(mockResponse))
        )
      );

      const result = await loginAPI.login(buildCredentials());

      expect(result).toEqual(mockResponse);
    });

    it('should send correct request body', async () => {
      let requestBody: Record<string, string> | null = null;
      const credentials = buildCredentials();

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, async (req, res, ctx) => {
          requestBody = await req.json();
          return res(ctx.status(200), ctx.json(buildLoginResponse()));
        })
      );

      await loginAPI.login(credentials);

      expect(requestBody).toEqual(credentials);
    });
  });

  describe('error handling', () => {
    it('should throw AuthenticationError on 401 response', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(AuthenticationError);
    });

    it('should throw ApiError with correct message for 400 status', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Bad request' }))
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow('Invalid login data');
    });

    it('should throw ApiError for 403 status', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(403), ctx.json({ message: 'Forbidden' }))
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow('Forbidden');
    });

    it('should throw ApiError for 404 status', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(404), ctx.json({ message: 'Not found' }))
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow('Login not found');
    });

    it('should map 408 to a timeout ApiError', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(408), ctx.json({ message: 'Request timeout' }))
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Request timed out. Please try again.'
      );
    });

    it('should throw ApiError for 429 rate limit', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(429), ctx.json({ message: 'Too many requests' }))
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Too many requests. Please slow down.'
      );
    });

    it('should throw ApiError for 500 server error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Internal server error' }))
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Server error. Please try again later.'
      );
    });

    it('should throw ApiError for 502 bad gateway', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(502), ctx.json({ message: 'Bad gateway' }))
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Service unavailable. Please try again later.'
      );
    });

    it('should throw ApiError for 503 service unavailable', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(503), ctx.json({ message: 'Service unavailable' }))
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Service unavailable. Please try again later.'
      );
    });

    it('should map 504 to a service unavailable ApiError', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(504), ctx.json({ message: 'Gateway timeout' }))
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Service unavailable. Please try again later.'
      );
    });

    it('should handle network errors', async () => {
      server.use(rest.post(API_ENDPOINTS.LOGIN, (_, res) => res.networkError('Failed to fetch')));

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Network error. Please check your connection.'
      );
    });
  });

  describe('request cancellation', () => {
    it('should handle pre-aborted AbortSignal', async () => {
      const controller = new AbortController();

      // Abort before making the request
      controller.abort();

      await expect(
        loginAPI.login(buildCredentials(), { signal: controller.signal })
      ).rejects.toThrow();
    });

    it('should not throw if request completes before cancellation', async () => {
      const controller = new AbortController();
      const mockResponse = buildLoginResponse();

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(mockResponse))
        )
      );

      const result = await loginAPI.login(buildCredentials(), { signal: controller.signal });

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
