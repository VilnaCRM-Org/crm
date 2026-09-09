import { http, HttpResponse } from 'msw';

import '../../../../setup';
import API_ENDPOINTS from '@/config/api-config';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import LoginAPI from '@/modules/user/features/auth/repositories/login-api';
import { AuthenticationError } from '@/modules/user/lib/api-errors';
import { buildCredentials, buildLoginResponse } from '@tests/builders';

import server from '../../../../mocks/server';

describe('LoginAPI Integration', () => {
  let loginAPI: LoginAPI;

  afterEach(() => server.resetHandlers());

  beforeEach(() => {
    // Resolve from actual DI container
    loginAPI = container.resolve<LoginAPI>(AUTH_TOKENS.LoginAPI);
  });

  describe('successful login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = buildLoginResponse();

      server.use(http.post(API_ENDPOINTS.LOGIN, () => HttpResponse.json(mockResponse)));

      const result = await loginAPI.login(buildCredentials());

      expect(result).toEqual(mockResponse);
    });

    it('should send correct request body', async () => {
      let requestBody: Record<string, string> | null = null;
      const credentials = buildCredentials();

      server.use(
        http.post(API_ENDPOINTS.LOGIN, async ({ request }) => {
          requestBody = (await request.json()) as Record<string, string>;
          return HttpResponse.json(buildLoginResponse());
        })
      );

      await loginAPI.login(credentials);

      expect(requestBody).toEqual(credentials);
    });
  });

  describe('error handling', () => {
    it('should throw AuthenticationError on 401 response', async () => {
      server.use(
        http.post(API_ENDPOINTS.LOGIN, () =>
          HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(AuthenticationError);
    });

    it('should throw ApiError with correct message for 400 status', async () => {
      server.use(
        http.post(API_ENDPOINTS.LOGIN, () =>
          HttpResponse.json({ message: 'Bad request' }, { status: 400 })
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow('Invalid login data');
    });

    it('should throw ApiError for 403 status', async () => {
      server.use(
        http.post(API_ENDPOINTS.LOGIN, () =>
          HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow('Forbidden');
    });

    it('should throw ApiError for 404 status', async () => {
      server.use(
        http.post(API_ENDPOINTS.LOGIN, () =>
          HttpResponse.json({ message: 'Not found' }, { status: 404 })
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow('Login not found');
    });

    it('should map 408 to a timeout ApiError', async () => {
      server.use(
        http.post(API_ENDPOINTS.LOGIN, () =>
          HttpResponse.json({ message: 'Request timeout' }, { status: 408 })
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Request timed out. Please try again.'
      );
    });

    it('should throw ApiError for 429 rate limit', async () => {
      server.use(
        http.post(API_ENDPOINTS.LOGIN, () =>
          HttpResponse.json({ message: 'Too many requests' }, { status: 429 })
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Too many requests. Please slow down.'
      );
    });

    it('should throw ApiError for 500 server error', async () => {
      server.use(
        http.post(API_ENDPOINTS.LOGIN, () =>
          HttpResponse.json({ message: 'Internal server error' }, { status: 500 })
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Server error. Please try again later.'
      );
    });

    it('should throw ApiError for 502 bad gateway', async () => {
      server.use(
        http.post(API_ENDPOINTS.LOGIN, () =>
          HttpResponse.json({ message: 'Bad gateway' }, { status: 502 })
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Service unavailable. Please try again later.'
      );
    });

    it('should throw ApiError for 503 service unavailable', async () => {
      server.use(
        http.post(API_ENDPOINTS.LOGIN, () =>
          HttpResponse.json({ message: 'Service unavailable' }, { status: 503 })
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Service unavailable. Please try again later.'
      );
    });

    it('should map 504 to a service unavailable ApiError', async () => {
      server.use(
        http.post(API_ENDPOINTS.LOGIN, () =>
          HttpResponse.json({ message: 'Gateway timeout' }, { status: 504 })
        )
      );

      await expect(loginAPI.login(buildCredentials())).rejects.toThrow(
        'Service unavailable. Please try again later.'
      );
    });

    it('should handle network errors', async () => {
      server.use(http.post(API_ENDPOINTS.LOGIN, () => HttpResponse.error()));

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

      server.use(http.post(API_ENDPOINTS.LOGIN, () => HttpResponse.json(mockResponse)));

      const result = await loginAPI.login(buildCredentials(), { signal: controller.signal });

      controller.abort();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('DI container integration', () => {
    it('should be resolvable from DI container multiple times', () => {
      const instance1 = container.resolve<LoginAPI>(AUTH_TOKENS.LoginAPI);
      const instance2 = container.resolve<LoginAPI>(AUTH_TOKENS.LoginAPI);

      expect(instance1).toBeInstanceOf(LoginAPI);
      expect(instance2).toBeInstanceOf(LoginAPI);
    });
  });
});
