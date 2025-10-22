import { rest } from 'msw';

import '../../../../setup';
import API_ENDPOINTS from '@/config/apiConfig';
import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import { ConflictError } from '@/modules/User/features/Auth/api/ApiErrors';
import RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';

import server from '../../../../mocks/server';

describe('RegistrationAPI Integration', () => {
  let registrationAPI: RegistrationAPI;

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    // Resolve from actual DI container
    registrationAPI = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);
  });

  describe('successful registration', () => {
    it('should successfully register with valid credentials', async () => {
      const mockResponse = {
        fullName: 'New User',
        email: 'newuser@example.com',
        message: 'User registered successfully',
      };

      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(201), ctx.json(mockResponse))
        )
      );

      const result = await registrationAPI.register({
        email: 'newuser@example.com',
        password: 'securepass123',
        fullName: 'New User',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should send correct request body with all fields', async () => {
      let requestBody: Record<string, string> | null = null;

      server.use(
        rest.post(API_ENDPOINTS.REGISTER, async (req, res, ctx) => {
          requestBody = await req.json();
          return res(ctx.status(201), ctx.json({ fullName: 'Test User', email: 'test@test.com' }));
        })
      );

      await registrationAPI.register({
        email: 'user@test.com',
        password: 'mypassword123',
        fullName: 'John Doe',
      });

      expect(requestBody).toEqual({
        email: 'user@test.com',
        password: 'mypassword123',
        fullName: 'John Doe',
      });
    });
  });

  describe('error handling', () => {
    it('should throw ConflictError on 409 response (user already exists)', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(409), ctx.json({ message: 'User already exists' }))
        )
      );

      await expect(
        registrationAPI.register({
          email: 'existing@test.com',
          password: 'pass123',
          fullName: 'Existing User',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError with correct message', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(409), ctx.json({ message: 'Conflict' }))
        )
      );

      await expect(
        registrationAPI.register({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      ).rejects.toThrow('Registration conflict. Resource already exists.');
    });

    it('should throw ApiError with correct message for 400 status', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Bad request' }))
        )
      );

      await expect(
        registrationAPI.register({
          email: 'invalid-email',
          password: '123',
          fullName: '',
        })
      ).rejects.toThrow('Invalid registration data');
    });

    it('should throw ApiError for 422 unprocessable entity', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(422), ctx.json({ message: 'Unprocessable entity' }))
        )
      );

      await expect(
        registrationAPI.register({
          email: 'test@test.com',
          password: 'weak',
          fullName: 'Test',
        })
      ).rejects.toThrow('Unprocessable registration data');
    });

    it('should throw ApiError for 401 status', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Unauthorized' }))
        )
      );

      await expect(
        registrationAPI.register({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw ApiError for 403 forbidden', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(403), ctx.json({ message: 'Forbidden' }))
        )
      );

      await expect(
        registrationAPI.register({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      ).rejects.toThrow('Forbidden');
    });

    it('should throw ApiError for 404 not found', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(404), ctx.json({ message: 'Not found' }))
        )
      );

      await expect(
        registrationAPI.register({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      ).rejects.toThrow('Registration not found');
    });

    it('should throw ApiError for 429 rate limit', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(429), ctx.json({ message: 'Too many requests' }))
        )
      );

      await expect(
        registrationAPI.register({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      ).rejects.toThrow('Too many requests. Please slow down.');
    });

    it('should throw ApiError for 500 server error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Internal server error' }))
        )
      );

      await expect(
        registrationAPI.register({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      ).rejects.toThrow('Server error. Please try again later.');
    });

    it('should handle network errors', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res) => res.networkError('Failed to fetch'))
      );

      await expect(
        registrationAPI.register({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      ).rejects.toThrow('Network error. Please check your connection.');
    });
  });

  describe('request cancellation', () => {
    it('should handle pre-aborted AbortSignal', async () => {
      const controller = new AbortController();

      // Abort before making the request
      controller.abort();

      await expect(
        registrationAPI.register(
          {
            email: 'test@test.com',
            password: 'pass',
            fullName: 'Test',
          },
          { signal: controller.signal }
        )
      ).rejects.toThrow();
    });

    it('should not throw if request completes before cancellation', async () => {
      const controller = new AbortController();
      const mockResponse = { fullName: 'Test User', email: 'test@test.com' };

      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(201), ctx.json(mockResponse))
        )
      );

      const result = await registrationAPI.register(
        {
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        },
        { signal: controller.signal }
      );

      controller.abort();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('DI container integration', () => {
    it('should be resolvable from DI container multiple times', () => {
      const instance1 = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);
      const instance2 = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);

      expect(instance1).toBeInstanceOf(RegistrationAPI);
      expect(instance2).toBeInstanceOf(RegistrationAPI);
    });
  });
});
